import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../../lib/apiClient';
import { BACKEND_URL } from '../../config';

interface Author {
  id: number;
  name: string | null;
  email: string;
  avatar: string | null;
  bio?: string | null;
}

interface Blog {
  id: number;
  title: string;
  content: string;
  published: boolean;
  authorId: number;
  date: string;
  author?: Author;
}

interface Comment {
  id: number;
  text: string;
  content?: string; // Support both field names for compatibility
  userId: number;
  blogId: number;
  createdAt: string;
  user?: Author;
}

interface Like {
  id: number;
  userId: number;
  blogId: number;
  value: number;
}

interface BlogsState {
  items: Blog[];
  currentBlog: Blog | null;
  loading: boolean;
  error: string | null;
  comments: Record<number, Comment[]>;
  likes: Record<number, Like[]>;
  commentsLoading: Record<number, boolean>;
  likesLoading: Record<number, boolean>;
}

// Cache for blogs and comments
let blogsCache: Blog[] = [];
let commentsCache: Record<number, Comment[]> = {};
let lastBlogsFetchTime = 0;
let lastCommentsFetchTime: Record<number, number> = {};
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const initialState: BlogsState = {
  items: [],
  currentBlog: null,
  loading: false,
  error: null,
  comments: {},
  likes: {},
  commentsLoading: {},
  likesLoading: {},
};

// Async thunks
export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (_, { rejectWithValue }) => {
    try {
      const now = Date.now();
      if (blogsCache.length > 0 && (now - lastBlogsFetchTime) < CACHE_DURATION) {
        return blogsCache;
      }

      // Get token but don't require it for blog listing
      const token = localStorage.getItem('token');
      
      // Use public endpoint instead of requiring authentication
      const response = await axios.get(`${BACKEND_URL}/api/v1/blog`);

      blogsCache = response.data.blogs;
      lastBlogsFetchTime = now;

      if (response.data.blogs) {
        const blogsWithAuthors = await Promise.all(
          response.data.blogs.map(async (blog: Blog) => {
            try {
              // Try to get author with token if available
              const authorResponse = token 
                ? await axios.get(
                    `${BACKEND_URL}/api/v1/user/${blog.authorId}`,
                    { headers: { Authorization: token } }
                  )
                : { data: { user: { id: blog.authorId, name: 'Anonymous', email: 'unknown', avatar: null } } };

              return {
                ...blog,
                author: authorResponse.data.user,
              };
            } catch (error) {
              console.error(`Error fetching author for blog ${blog.id}:`, error);
              return {
                ...blog,
                author: {
                  id: blog.authorId,
                  name: 'Unknown User',
                  email: 'unknown',
                  avatar: null,
                },
              };
            }
          })
        );

        return blogsWithAuthors;
      }
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch blogs');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const fetchBlog = createAsyncThunk(
  'blogs/fetchBlog',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      // Fetch blog data
      const blogResponse = await axios.get(`${BACKEND_URL}/api/v1/blog/${id}`, {
        headers: { Authorization: token },
      });

      if (!blogResponse.data.blog) {
        return rejectWithValue('Blog not found');
      }

      const blogData = blogResponse.data.blog;

      // Fetch author data
      const authorResponse = await axios.get(
        `${BACKEND_URL}/api/v1/user/${blogData.authorId}`,
        {
          headers: { Authorization: token },
        }
      );

      return {
        ...blogData,
        author: authorResponse.data.user || {
          id: blogData.authorId,
          name: 'Unknown User',
          email: 'unknown',
          avatar: null,
        },
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch blog');
    }
  }
);

export const fetchComments = createAsyncThunk(
  'blogs/fetchComments',
  async (blogId: number, { rejectWithValue, getState }) => {
    try {
      const now = Date.now();
      const state = getState() as { blogs: BlogsState };
      
      // Check if we already have recent comments for this blog
      if (commentsCache[blogId] && 
          (now - (lastCommentsFetchTime[blogId] || 0)) < CACHE_DURATION &&
          state.blogs.comments[blogId]?.length > 0) {
        return { blogId, comments: commentsCache[blogId] };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/v1/blog/${blogId}/comments`,
        {
          headers: { Authorization: token },
        }
      );

      // Cache the comments
      const comments = response.data.comments || [];
      commentsCache[blogId] = comments;
      lastCommentsFetchTime[blogId] = now;

      // If no comments, return empty array to avoid unnecessary API calls
      if (!comments || comments.length === 0) {
        return { blogId, comments: [] };
      }

      // Get unique user IDs to avoid duplicate user fetches
      const userIds = [...new Set(comments.map((comment: Comment) => comment.userId))];
      const userResponses = await Promise.all(
        userIds.map(async (userId: number) => {
          try {
            const userResponse = await axios.get(
              `${BACKEND_URL}/api/v1/user/${userId}`,
              {
                headers: { Authorization: token },
              }
            );
            return { userId, user: userResponse.data.user };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return { 
              userId, 
              user: { 
                id: userId, 
                name: 'Unknown User', 
                email: 'unknown', 
                avatar: null 
              } 
            };
          }
        })
      );

      // Create a map of users by ID for quick lookup
      const userMap: Record<number, Author> = {};
      userResponses.forEach(response => {
        userMap[response.userId] = response.user;
      });

      // Attach user data to comments
      const commentsWithUsers = comments.map((comment: Comment) => ({
        ...comment,
        user: userMap[comment.userId]
      }));

      return { blogId, comments: commentsWithUsers };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const fetchLikes = createAsyncThunk(
  'blogs/fetchLikes',
  async (blogId: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/v1/blog/${blogId}/like`);
      return { blogId, likes: response.data.likes || [] };
    } catch (error) {
      return rejectWithValue('Failed to fetch likes');
    }
  }
);

export const addComment = createAsyncThunk(
  'blogs/addComment',
  async (
    { blogId, content, userId }: { blogId: number; content: string; userId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(
        `/api/v1/blog/${blogId}/comment`,
        { text: content }
      );

      if (response.data.comment) {
        const userResponse = await apiClient.get(
          `/api/v1/user/${response.data.comment.userId}`
        );

        const commentWithUser = {
          ...response.data.comment,
          user: userResponse.data.user || userResponse.data, // Handle both response formats
        };

        return { blogId, comment: commentWithUser };
      }
      return rejectWithValue('Failed to add comment');
    } catch (error) {
      console.error("Error adding comment:", error);
      return rejectWithValue('Failed to add comment');
    }
  }
);

export const updateLike = createAsyncThunk(
  'blogs/updateLike',
  async (
    {
      blogId,
      value,
      userId,
    }: { blogId: number; value: number; userId: number },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.post(
        `/api/v1/blog/${blogId}/like`,
        { value }
      );

      return { blogId, value, userId };
    } catch (error) {
      console.error("Error updating like:", error);
      return rejectWithValue('Failed to update like');
    }
  }
);

const blogSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    clearBlogState: (state) => {
      state.currentBlog = null;
      state.error = null;
    },
    clearCache: (state) => {
      blogsCache = [];
      commentsCache = {};
      lastBlogsFetchTime = 0;
      lastCommentsFetchTime = {};
      state.items = [];
      state.comments = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch blogs
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action: PayloadAction<Blog[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch single blog
      .addCase(fetchBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlog.fulfilled, (state, action: PayloadAction<Blog>) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })
      .addCase(fetchBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch comments
      .addCase(fetchComments.pending, (state, action) => {
        const blogId = action.meta.arg;
        state.commentsLoading = {
          ...state.commentsLoading,
          [blogId]: true,
        };
      })
      .addCase(
        fetchComments.fulfilled,
        (
          state,
          action: PayloadAction<{ blogId: number; comments: Comment[] }>
        ) => {
          const { blogId, comments } = action.payload;
          state.comments = {
            ...state.comments,
            [blogId]: comments,
          };
          state.commentsLoading = {
            ...state.commentsLoading,
            [blogId]: false,
          };
        }
      )
      .addCase(fetchComments.rejected, (state, action) => {
        const blogId = action.meta.arg;
        state.commentsLoading = {
          ...state.commentsLoading,
          [blogId]: false,
        };
      })

      // Fetch likes
      .addCase(fetchLikes.pending, (state, action) => {
        const blogId = action.meta.arg;
        state.likesLoading = {
          ...state.likesLoading,
          [blogId]: true,
        };
      })
      .addCase(
        fetchLikes.fulfilled,
        (state, action: PayloadAction<{ blogId: number; likes: Like[] }>) => {
          const { blogId, likes } = action.payload;
          state.likes = {
            ...state.likes,
            [blogId]: likes,
          };
          state.likesLoading = {
            ...state.likesLoading,
            [blogId]: false,
          };
        }
      )
      .addCase(fetchLikes.rejected, (state, action) => {
        const blogId = action.meta.arg;
        state.likesLoading = {
          ...state.likesLoading,
          [blogId]: false,
        };
      })

      // Add comment
      .addCase(
        addComment.fulfilled,
        (
          state,
          action: PayloadAction<{ blogId: number; comment: Comment }>
        ) => {
          const { blogId, comment } = action.payload;
          const currentComments = state.comments[blogId] || [];
          state.comments = {
            ...state.comments,
            [blogId]: [comment, ...currentComments],
          };
        }
      )

      // Update like
      .addCase(
        updateLike.fulfilled,
        (
          state,
          action: PayloadAction<{
            blogId: number;
            value: number;
            userId: number;
          }>
        ) => {
          const { blogId, value, userId } = action.payload;
          const currentLikes = [...(state.likes[blogId] || [])];

          // Find if the user already has a like/dislike
          const existingLikeIndex = currentLikes.findIndex(
            (like) => like.userId === userId
          );

          if (value === 0 && existingLikeIndex !== -1) {
            // Remove like
            currentLikes.splice(existingLikeIndex, 1);
          } else if (existingLikeIndex !== -1) {
            // Update existing like
            currentLikes[existingLikeIndex] = {
              ...currentLikes[existingLikeIndex],
              value,
            };
          } else if (value !== 0) {
            // Add new like
            currentLikes.push({
              id: Date.now(), // Temporary ID
              userId,
              blogId,
              value,
            });
          }

          state.likes = {
            ...state.likes,
            [blogId]: currentLikes,
          };
        }
      );
  },
});

export const { clearBlogState, clearCache } = blogSlice.actions;
export default blogSlice.reducer; 