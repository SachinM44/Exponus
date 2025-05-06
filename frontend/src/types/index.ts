// API Response Types
export interface User {
  id: number;
  name: string | null;
  username: string;
  avatar: string | null;
  bio?: string | null;
}

export interface Blog {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: User;
}

export interface Comment {
  id: number;
  content: string;
  blogId: number;
  userId: number;
  createdAt: string;
  user?: {
    name: string | null;
    avatar: string | null;
  };
}

export interface Like {
  id: number;
  blogId: number;
  userId: number;
  type: 'LIKE' | 'DISLIKE';
  createdAt: string;
}

// API Response Payloads
export interface BlogResponse {
  blog: Blog;
}

export interface BlogsResponse {
  blogs: Blog[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalBlogs: number;
    totalPages: number;
  };
}

export interface CommentsResponse {
  comments: Comment[];
}

export interface LikesResponse {
  likes: Like[];
  stats?: {
    likesCount: number;
    dislikesCount: number;
    total: number;
  };
}
