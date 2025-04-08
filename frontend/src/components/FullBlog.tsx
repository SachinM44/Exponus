import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlog } from '../hooks/useBlogs';
import { useComments, useAddComment } from '../hooks/useComments';
import { useUser } from '../hooks/useUser';
import Appbar from './Appbar';
import Avatar from './Avatar';
import { formatDistanceToNow, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchLikes, updateLike } from '../store/slices/blogSlice';

interface UserAuthor {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
    bio?: string | null;
}

// Update interface for addComment payload to match Redux action
interface AddCommentPayload {
    blogId: number;
    content: string;
    userId: number;
}

// Safe date formatter that handles invalid dates
const formatDateSafe = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'Recently';
    
    try {
        const date = new Date(dateStr);
        if (!isValid(date)) return 'Recently';
        return `${formatDistanceToNow(date)} ago`;
    } catch (error) {
        console.error('Invalid date format:', dateStr);
        return 'Recently';
    }
};

export const FullBlog = () => {
    const { id } = useParams<{ id: string }>();
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { likes } = useAppSelector((state) => state.blogs);

    const blogId = Number(id);
    const { data: blog, isLoading: blogLoading } = useBlog(blogId);
    const { data: comments, isLoading: commentsLoading } = useComments(blogId);
    const { mutate: addComment, isPending: isSubmitting } = useAddComment(blogId);
    const { data: currentUser } = useUser();
    
    // Get blog-specific likes
    const blogLikes = likes[blogId] || [];
    
    // Calculate like/dislike counts
    const likesCount = blogLikes.filter(like => like.value === 1).length;
    const dislikesCount = blogLikes.filter(like => like.value === -1).length;
    
    // Check if the current user has liked or disliked the blog
    const userLikeStatus = currentUser 
        ? (blogLikes.find(like => like.userId === currentUser.id)?.value || 0)
        : 0;

    const handleAddComment = async () => {
        if (!commentText.trim() || isSubmitting || !currentUser) {
            return;
        }

        try {
            await addComment(commentText.trim());
            setCommentText('');
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };
    
    // Handle like/dislike action
    const handleLikeAction = (value: number) => () => {
        if (!currentUser) {
            toast.error("Please sign in to interact with posts");
            return;
        }
        
        // First fetch current likes if we don't have them
        if (!blogLikes.length) {
            dispatch(fetchLikes(blogId));
        }
        
        // If user clicked same button that's already active, treat as unlike
        const newValue = userLikeStatus === value ? 0 : value;
        
        // Dispatch the update like action with the appropriate value
        dispatch(updateLike({
            blogId: blogId, 
            value: newValue, 
            userId: currentUser.id
        })).unwrap()
        .then(() => {
            if (newValue === 1) {
                toast.success("You liked this post");
            } else if (newValue === -1) {
                toast.success("You disliked this post");
            }
        })
        .catch(() => {
            toast.error("Failed to update like status");
        });
    };
    
    // Handle share
    const handleShare = () => {
        const url = window.location.href;
        
        // Use the Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: blog?.title || 'Blog post',
                text: blog?.content.slice(0, 100) || '',
                url: url
            })
            .then(() => toast.success("Shared successfully"))
            .catch((error) => {
                console.error("Error sharing:", error);
                
                // Fallback: copy to clipboard
                copyToClipboard(url);
            });
        } else {
            // Fallback: copy to clipboard
            copyToClipboard(url);
        }
    };
    
    // Helper to copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success("Link copied to clipboard"))
            .catch(() => toast.error("Failed to copy link"));
    };

    if (blogLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Appbar />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Appbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-red-500">Blog not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Appbar />
            <main className="container mx-auto px-4 py-8">
                <article className="prose prose-lg dark:prose-invert mx-auto">
                    <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
                    
                    <div className="flex items-center mb-8">
                        <Avatar 
                            name={blog.author.name || blog.author.email} 
                            src={blog.author.avatar || undefined}
                            size="medium"
                        />
                        <div className="ml-4">
                            <p className="font-medium">{blog.author.name || blog.author.email}</p>
                            <p className="text-sm text-gray-500">
                                {formatDateSafe(blog.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{blog.content}</ReactMarkdown>
                    </div>
                    
                    {/* Interaction buttons */}
                    <div className="flex items-center space-x-6 my-8 border-t border-b border-gray-200 dark:border-gray-700 py-4">
                        {/* Like button */}
                        <button 
                            onClick={handleLikeAction(1)}
                            className={`flex items-center ${userLikeStatus === 1 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"} hover:text-blue-500 transition-colors`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill={userLikeStatus === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="font-medium">{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                        
                        {/* Dislike button */}
                        <button 
                            onClick={handleLikeAction(-1)}
                            className={`flex items-center ${userLikeStatus === -1 ? "text-red-500" : "text-gray-500 dark:text-gray-400"} hover:text-red-500 transition-colors`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill={userLikeStatus === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                            </svg>
                            <span className="font-medium">{dislikesCount} {dislikesCount === 1 ? 'Dislike' : 'Dislikes'}</span>
                        </button>
                        
                        {/* Share button */}
                        <button 
                            onClick={handleShare}
                            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span className="font-medium">Share</span>
                        </button>
                    </div>

                    <div className="mt-12">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {showComments ? 'Hide Comments' : `Show Comments (${blog.comments})`}
                        </button>

                        {showComments && (
                            <div className="mt-6">
                                {currentUser && (
                                    <div className="mb-6">
                                        <textarea
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={3}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={isSubmitting || !commentText.trim()}
                                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                                        </button>
                                    </div>
                                )}

                                {commentsLoading ? (
                                    <div className="flex justify-center my-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : comments?.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
                                ) : (
                                    <div className="space-y-6">
                                        {comments?.map((comment) => (
                                            <div key={comment.id} className="flex space-x-4">
                                                <Avatar
                                                    name={comment.user?.name || 'Anonymous'}
                                                    src={comment.user?.avatar}
                                                    size="small"
                                                />
                                                <div>
                                                    <p className="font-medium">{comment.user?.name || 'Anonymous'}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDateSafe(comment.createdAt)}
                                                    </p>
                                                    <p className="mt-1">{comment.content || comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </article>
            </main>
        </div>
    );
}