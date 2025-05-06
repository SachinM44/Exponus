import { Link } from "react-router-dom";
import { useState, memo, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useLikes, useUpdateLike } from "../hooks/useLikes";
import { useComments } from "../hooks/useComments";
import { useUser } from "../hooks/useUser";
import Avatar from "./Avatar";
import { Like } from "../types";
import {
    HandThumbUpIcon as HandThumbUpIconSolid,
    HandThumbDownIcon as HandThumbDownIconSolid,
    ChatBubbleOvalLeftIcon as ChatBubbleIconSolid,
    ClockIcon
} from '@heroicons/react/24/solid';
import {
    HandThumbUpIcon as HandThumbUpIconOutline,
    HandThumbDownIcon as HandThumbDownIconOutline,
    ChatBubbleOvalLeftIcon as ChatBubbleIconOutline,
    ShareIcon as ShareIconOutline
} from '@heroicons/react/24/outline';

interface BlogCardProps {
    id: number;
    title: string;
    authorName: string;
    publishedDate: string;
    authorAvatar?: string | null;
    content?: string;
    onClick?: () => void;
}

// Memoize the BlogCard component to prevent unnecessary re-renders
export const BlogCard = memo(({
    id,
    title,
    authorName,
    publishedDate,
    authorAvatar,
    content,
    onClick
}: BlogCardProps) => {
    const { data: blogLikesData, isLoading: likesLoading } = useLikes(id);
    const { data: blogCommentsData, isLoading: commentsLoading } = useComments(id);
    const { data: profile } = useUser();
    const updateLikeMutation = useUpdateLike(id);
    
    const blogLikes = blogLikesData?.likes || [];
    const blogComments = blogCommentsData?.comments || [];
    
    const likesCount = blogLikes.filter(like => like.type === 'LIKE').length;
    const dislikesCount = blogLikes.filter(like => like.type === 'DISLIKE').length;
    const commentsCount = blogComments.length;
    
    // Format date for better readability
    const formattedDate = useMemo(() => {
        try {
            // Simple check if the date is missing or invalid
            if (!publishedDate || publishedDate === 'Invalid Date') {
                return 'Recently';
            }
            
            // Try to parse the date
            const date = new Date(publishedDate);
            
            // Explicit check for invalid date
            if (isNaN(date.getTime())) {
                console.log('Invalid date format received:', publishedDate);
                return 'Recently';
            }
            
            // Format the date properly
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // If less than 2 days, show relative time
            if (diffDays <= 2) {
                // For very recent posts (less than a day)
                if (diffDays < 1) {
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                    if (diffHours < 1) {
                        const diffMinutes = Math.floor(diffTime / (1000 * 60));
                        return diffMinutes < 1 ? 'Just now' : `${diffMinutes} minutes ago`;
                    }
                    return `${diffHours} hours ago`;
                }
                return diffDays === 1 ? 'Yesterday' : '2 days ago';
            }
            
            // Otherwise show the formatted date
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Recently';
        }
    }, [publishedDate]);
    
    // Calculate estimated reading time if content is available
    const readingTime = useMemo(() => {
        if (!content) return null;
        
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = content.trim().split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    }, [content]);
    
    // Check if the current user has liked or disliked the blog
    const userLikeStatus = useMemo(() => {
        if (!profile) return null;
        const userLike = blogLikes.find(like => like.userId === profile.id);
        return userLike ? userLike.type : null;
    }, [profile, blogLikes]);

    // Handle like/dislike action using React Query mutation
    const handleLikeAction = (newType: 'LIKE' | 'DISLIKE') => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!profile) {
            toast.error("Please sign in to like posts");
            return;
        }
        
        updateLikeMutation.mutate({ type: newType });
    };
    
    // Handle share
    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const url = `${window.location.origin}/blog/${id}`;
        
        // Use the Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: title,
                text: url,
                url: url
            })
            .catch((error) => {
                console.error("Error sharing:", error);
                
                // Only show toast on error
                copyToClipboard(url, true);
            });
        } else {
            // Fallback: copy to clipboard
            copyToClipboard(url, true);
        }
    };
    
    // Helper to copy to clipboard
    const copyToClipboard = (text: string, showToast = false) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                if (showToast) {
                    toast.success("Link copied to clipboard");
                }
            })
            .catch(() => {
                toast.error("Failed to copy link");
            });
    };
    
    return (
        <div
            className="w-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg rounded-xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm cursor-pointer"
            onClick={() => onClick ? onClick() : null}
            role="article"
            aria-labelledby={`blog-title-${id}`}
        >
            <div className="p-5">
                <div className="flex items-center space-x-3 mb-3">
                    <Avatar name={authorName} src={authorAvatar || undefined} size="small" />
                    <div>
                        <h3 className="font-medium dark:text-white">{authorName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
                    </div>
                </div>
                
                <h2 id={`blog-title-${id}`} className="text-2xl font-bold mb-2 leading-tight text-gray-900 dark:text-white line-clamp-2">{title}</h2>
                
                <div className="h-4"></div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        {/* Like Button */}
                        <button
                            onClick={(e) => handleLikeAction('LIKE')(e)}
                            disabled={updateLikeMutation.isPending}
                            className={`flex items-center transition-colors disabled:opacity-50 ${userLikeStatus === 'LIKE' ? "text-blue-500" : "text-gray-500 dark:text-gray-400 hover:text-blue-500"}`}
                            aria-label={`Like post: ${title}. Current likes: ${likesCount}`}
                        >
                            {userLikeStatus === 'LIKE' ? 
                                <HandThumbUpIconSolid className="h-5 w-5 mr-1" /> : 
                                <HandThumbUpIconOutline className="h-5 w-5 mr-1" />
                            }
                            {likesLoading ? '...' : likesCount}
                        </button>
                        {/* Dislike Button */}
                        <button
                            onClick={(e) => handleLikeAction('DISLIKE')(e)}
                            disabled={updateLikeMutation.isPending}
                            className={`flex items-center transition-colors disabled:opacity-50 ${userLikeStatus === 'DISLIKE' ? "text-red-500" : "text-gray-500 dark:text-gray-400 hover:text-red-500"}`}
                            aria-label={`Dislike post: ${title}. Current dislikes: ${dislikesCount}`}
                        >
                            {userLikeStatus === 'DISLIKE' ? 
                                <HandThumbDownIconSolid className="h-5 w-5 mr-1" /> : 
                                <HandThumbDownIconOutline className="h-5 w-5 mr-1" />
                            }
                            {likesLoading ? '...' : dislikesCount}
                        </button>
                        {/* Comment Button/Link */}
                        <Link
                            to={`/blog/${id}#comments`}
                            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            onClick={(e) => { e.stopPropagation(); }} 
                            aria-label={`View comments for post: ${title}. Current comments: ${commentsCount}`}
                        >
                            <ChatBubbleIconOutline className="h-5 w-5 mr-1" />
                            {commentsLoading ? '...' : commentsCount}
                        </Link>
                    </div>
                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        aria-label={`Share post: ${title}`}
                    >
                        <ShareIconOutline className="h-5 w-5" />
                    </button>
                </div>
                {readingTime && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {readingTime}
                    </div>
                )}
            </div>
        </div>
    );
});

// Simple Circle component for use in skeletons
export const Circle = () => (
  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
);

// Also export BlogCard as default for backward compatibility
export default BlogCard;