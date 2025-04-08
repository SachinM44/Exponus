import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBlog } from '../hooks/useBlogs';
import { useComments, useAddComment } from '../hooks/useComments';
import { useUser } from '../hooks/useUser';
import Appbar from './Appbar';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

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

export const FullBlog = () => {
    const { id } = useParams<{ id: string }>();
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    const { data: blog, isLoading: blogLoading } = useBlog(Number(id));
    const { data: comments, isLoading: commentsLoading } = useComments(Number(id));
    const { mutate: addComment, isPending: isSubmitting } = useAddComment(Number(id));
    const { data: currentUser } = useUser();

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
                                {formatDistanceToNow(new Date(blog.createdAt))} ago
                            </p>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{blog.content}</ReactMarkdown>
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
                                                        {formatDistanceToNow(new Date(comment.createdAt))} ago
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