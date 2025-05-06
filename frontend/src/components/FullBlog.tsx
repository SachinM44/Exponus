import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlog } from '../hooks/useBlogs';
import { useComments, useAddComment } from '../hooks/useComments';
import { useLikes, useUpdateLike } from '../hooks/useLikes';
import { useUser } from '../hooks/useUser';
import Avatar from './Avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Comment, Like } from '../types';

export const FullBlog = () => {
    const { id } = useParams<{ id: string }>();
    const blogId = Number(id);
    const [newComment, setNewComment] = useState('');
    
    const { data: blogData, isLoading: isBlogLoading, error: blogError } = useBlog(blogId);
    const { data: commentsData, isLoading: isCommentsLoading, error: commentsError } = useComments(blogId);
    const { data: likesData } = useLikes(blogId);
    const { data: currentUserData } = useUser();
    const addCommentMutation = useAddComment(blogId);
    const updateLikeMutation = useUpdateLike(blogId);

    const blog = blogData?.blog;
    const comments = commentsData?.comments ?? [];
    
    // Calculate likes, dislikes, and user's like status
    const { likeCount, dislikeCount, userLike } = useMemo(() => {
        const likesArray = likesData?.likes ?? [];
        let likes = 0;
        let dislikes = 0;
        let currentUserLike: 'LIKE' | 'DISLIKE' | null = null;
        
        likesArray.forEach((like: Like) => {
            if (like.type === 'LIKE') {
                likes++;
            } else if (like.type === 'DISLIKE') {
                dislikes++;
            }
            // Check if the current user performed this like/dislike
            if (currentUserData?.id === like.userId) {
                currentUserLike = like.type;
            }
        });
        
        return { likeCount: likes, dislikeCount: dislikes, userLike: currentUserLike };
    }, [likesData, currentUserData]); // Dependencies: recalculate when likes data or user data changes

    // Calculate reading time
    const readingTime = useMemo(() => {
        if (!blog?.content) return '1 min read';
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = blog.content.trim().split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    }, [blog?.content]);

    // Configure marked options
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Function to render markdown content safely
    const renderContent = (content: string) => {
        if (!content) return '';
        
        // Convert markdown to HTML
        const rawHtml = marked(content);
        
        // Configure sanitize-html options
        const allowedTags = ['img', 'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code'];
        const allowedAttributes = {
            img: ['src', 'alt', 'title', 'class', 'style'],
            a: ['href', 'target', 'rel'],
            '*': ['class']
        };
        
        // Sanitize the HTML
        return sanitizeHtml(rawHtml, {
            allowedTags,
            allowedAttributes,
            transformTags: {
                'img': (tagName, attribs) => {
                    // Add both class and inline style to ensure image size is applied
                    return {
                        tagName,
                        attribs: {
                            ...attribs,
                            class: 'blog-image max-w-full h-auto my-4',
                            style: 'max-width: 100%; height: auto; margin: 1rem 0;'
                        }
                    };
                }
            }
        });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        if (!currentUserData) {
            toast.error('Please sign in to comment');
            return;
        }
        
        addCommentMutation.mutate(
            { content: newComment },
            {
                onSuccess: () => {
                    setNewComment('');
                }
            }
        );
    };

    const handleLikeAction = (type: 'LIKE' | 'DISLIKE') => {
        if (!currentUserData) {
            toast.error("Please sign in to interact");
            return;
        }
        updateLikeMutation.mutate({ type });
    };

    if (isBlogLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (blogError || !blog) {
        return (
             <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                 <div className="container mx-auto px-4 py-8 text-center text-red-500">
                     Error loading blog
                 </div>
             </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{blog?.title}</h1>
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6">
                        <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {readingTime}
                        </span>
                        <span>•</span>
                        <span>{blog?.createdAt ? format(new Date(blog.createdAt), 'MMM d, yyyy') : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar 
                            name={blog?.author?.name ?? 'A'} 
                            size="medium" 
                            src={blog?.author?.avatar || undefined} 
                        />
                        <div>
                            <div className="text-xl font-bold">{blog?.author?.name ?? 'Anonymous'}</div>
                        </div>
                    </div>
                    
                    {/* Add custom CSS for blog images */}
                    <style>
                        {`
                         .blog-image {
                            max-width: 100% !important;
                            height: auto !important;
                            margin: 1rem 0 !important;
                            display: block !important;
                         }
                        `}
                    </style>
                    
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none break-words mt-6" 
                        dangerouslySetInnerHTML={{ __html: renderContent(blog?.content ?? '') }} 
                    />
                    
                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => handleLikeAction('LIKE')}
                            disabled={updateLikeMutation.isPending}
                            className={`flex items-center px-3 py-1 text-sm rounded ${
                                userLike === 'LIKE'
                                    ? "bg-blue-600 text-white" 
                                    : "bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                        >
                            <ThumbsUp className="mr-2 h-4 w-4" /> Like ({likeCount})
                        </button>
                        <button
                            onClick={() => handleLikeAction('DISLIKE')}
                            disabled={updateLikeMutation.isPending}
                            className={`flex items-center px-3 py-1 text-sm rounded ${
                                userLike === 'DISLIKE'
                                    ? "bg-blue-600 text-white" 
                                    : "bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                        >
                            <ThumbsDown className="mr-2 h-4 w-4" /> Dislike ({dislikeCount})
                        </button>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="text-2xl font-semibold mb-4">Comments ({comments.length})</h3>
                        
                        {currentUserData && (
                            <div className="mb-6">
                                <textarea
                                    placeholder="Write your comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:border-gray-600"
                                    rows={3}
                                ></textarea>
                                <button 
                                    onClick={handleAddComment} 
                                    disabled={!newComment.trim() || addCommentMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        )}
                        {!currentUserData && (
                            <p className="text-slate-500 dark:text-slate-400">Please <Link to="/signin" className="underline">sign in</Link> to comment.</p>
                        )}

                        {/* Display Comments */}
                        {isCommentsLoading && <p>Loading comments...</p>}
                        {commentsError && <p className="text-red-500">Error loading comments.</p>}
                        <div className="space-y-4">
                            {comments.map((comment: Comment) => (
                            <div key={comment.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                {/* Use optional chaining and default for comment author avatar/name */}
                                <Avatar 
                                name={comment.user?.name?.charAt(0) ?? 'U'} 
                                size="sm" 
                                src={comment.user?.avatar || undefined} 
                                />
                                <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm">{comment.user?.name ?? 'Anonymous'}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm mt-1 break-words">{comment.content}</p>
                                </div>
                            </div>
                            ))}
                            {!isCommentsLoading && comments.length === 0 && (
                            <p className="text-slate-500 dark:text-slate-400">No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};