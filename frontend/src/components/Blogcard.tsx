import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchLikes, updateLike } from "../store/slices/blogSlice";
import { useState, memo, useMemo } from "react";
import { toast } from "react-hot-toast";

interface BlogCardProps {
    id: number;
    title: string;
    content: string;
    authorName: string;
    publishedDate: string;
    authorAvatar?: string;
}

interface AvatarProps {
    name: string;
    size?: "small" | "medium" | "large";
    imageUrl?: string;
}

// Memoize the Avatar component to prevent unnecessary re-renders
export const Avatar = memo(({ name, size = "medium", imageUrl }: AvatarProps) => {
    const [imgError, setImgError] = useState(false);
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const sizeClasses = {
        small: "w-8 h-8 text-xs",
        medium: "w-10 h-10 text-sm",
        large: "w-12 h-12 text-base"
    };
    
    return (
        <div className={`relative rounded-full overflow-hidden flex items-center justify-center text-white font-medium ${sizeClasses[size]} bg-gradient-to-br from-indigo-500 to-purple-600`}>
            {imageUrl && !imgError ? (
                <img 
                    src={imageUrl} 
                    alt={`${name}'s avatar`} 
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            ) : (
                getInitials(name)
            )}
        </div>
    );
});

// Memoize the BlogCard component to prevent unnecessary re-renders
export const BlogCard = memo(({
    id,
    title,
    content,
    authorName,
    publishedDate,
    authorAvatar
}: BlogCardProps) => {
    const dispatch = useAppDispatch();
    const { likes, comments } = useAppSelector((state) => state.blogs);
    const { profile } = useAppSelector((state) => state.user);
    
    // Get blog-specific data
    const blogLikes = likes[id] || [];
    const blogComments = comments[id] || [];
    
    // Calculate like/dislike counts
    const likesCount = blogLikes.filter(like => like.value === 1).length;
    const dislikesCount = blogLikes.filter(like => like.value === -1).length;
    const commentsCount = blogComments.length;
    
    // Format date for better readability
    const formattedDate = new Date(publishedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Extract image URL from content if available
    const getImageUrl = useMemo(() => {
        // Look for markdown image syntax
        const imgRegex = /!\[.*?\]\((.*?)\)/;
        const match = content.match(imgRegex);
        
        if (match) {
            const url = match[1];
            // Make sure the URL is valid
            try {
                // For data URLs, ensure they start correctly
                if (url.startsWith('data:image/')) {
                    return url;
                }
                
                // For regular URLs, make sure they're properly formatted
                if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
                    return url;
                }
                
                // For relative URLs
                return url;
            } catch (e) {
                console.error("Error parsing image URL:", e);
                return null;
            }
        }
        return null;
    }, [content]);
    
    // Truncate content for preview (remove image markdown if present)
    const truncatedContent = useMemo(() => {
        let processedContent = content;
        
        // Remove image markdown
        processedContent = processedContent.replace(/!\[.*?\]\(.*?\)\n*/g, '');
        
        // Truncate to 150 characters
        return processedContent.length > 150 
            ? processedContent.substring(0, 150) + "..." 
            : processedContent;
    }, [content]);
    
    // Check if the current user has liked or disliked the blog
    const userLikeStatus = useMemo(() => {
        if (!profile) return 0;
        const userLike = blogLikes.find(like => like.userId === profile.id);
        return userLike ? userLike.value : 0;
    }, [profile, blogLikes]);

    // Handle like/dislike action
    const handleLikeAction = (value: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!profile) {
            toast.error("Please sign in to like posts");
            return;
        }
        
        // If user clicked same button that's already active, treat as unlike
        const newValue = userLikeStatus === value ? 0 : value;
        
        // Dispatch the update like action with the appropriate value
        dispatch(updateLike({
            blogId: id, 
            value: newValue, 
            userId: profile.id
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
    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const url = `${window.location.origin}/blog/${id}`;
        
        // Use the Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: title,
                text: truncatedContent,
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
    
    return (
        <div className="w-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg rounded-xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <Link to={`/blog/${id}`} className="block h-full">
                {/* Show image if available */}
                {getImageUrl && (
                    <div className="w-full h-48 overflow-hidden">
                        <img 
                            src={getImageUrl} 
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                        />
                    </div>
                )}
                
                <div className="p-5">
                    <div className="flex items-center space-x-3 mb-3">
                        <Avatar name={authorName} imageUrl={authorAvatar} />
                        <div>
                            <h3 className="font-medium dark:text-white">{authorName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2 leading-tight dark:text-white">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{truncatedContent}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                            {/* Like Button */}
                            <button 
                                onClick={handleLikeAction(1)}
                                className={`flex items-center ${userLikeStatus === 1 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"} hover:text-blue-500 transition-colors`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={userLikeStatus === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                <span>{likesCount}</span>
                            </button>
                            
                            {/* Dislike Button */}
                            <button 
                                onClick={handleLikeAction(-1)}
                                className={`flex items-center ${userLikeStatus === -1 ? "text-red-500" : "text-gray-500 dark:text-gray-400"} hover:text-red-500 transition-colors`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={userLikeStatus === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                                </svg>
                                <span>{dislikesCount}</span>
                            </button>
                            
                            {/* Comments Count */}
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span>{commentsCount}</span>
                            </div>
                            
                            {/* Share Button */}
                            <button 
                                onClick={handleShare}
                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>Share</span>
                            </button>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">Read more →</span>
                    </div>
                </div>
            </Link>
        </div>
    );
});

// Simple Circle component for use in skeletons
export const Circle = () => (
  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
);

// Also export BlogCard as default for backward compatibility
export default BlogCard;