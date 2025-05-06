import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AiBlogAssistant } from "../components/AiBlogAssistant";

export const Publish = () => {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageS3Url, setImageS3Url] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate()

    // Upload image to S3 and get the URL
    const uploadImageToS3 = async (file: File): Promise<string | null> => {
        if (!file) return null;
        
        setIsUploading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/signin");
                return null;
            }
            
            // Get presigned URL from backend
            const presignedResponse = await axios.post(`${BACKEND_URL}/api/v1/blog/image/presigned-url`, {
                contentType: file.type,
                filename: file.name,
            }, {
                headers: {
                    "Authorization": token
                }
            });

            if (!presignedResponse?.data?.presignedUrl || !presignedResponse?.data?.objectUrl) {
                throw new Error("Failed to get upload parameters.");
            }

            // Upload to S3 using presigned URL
            await axios.put(presignedResponse.data.presignedUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
            });

            return presignedResponse.data.objectUrl;

        } catch (error) {
            console.error("S3 Upload Error:", error);
            toast.error("Failed to upload image. Please try again.");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    // Insert an image into the content if it's not already included
    const insertImageIntoContent = () => {
        if (imageS3Url) {
            return `![Blog Image](${imageS3Url})\n\n${description}`
        }
        return description
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check if file is an image
        if (!file.type.match('image.*')) {
            toast.error('Please select an image file')
            return
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB')
            return
        }

        setImageFile(file)
        setImageS3Url(null) // Reset S3 URL when a new image is selected

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setImageS3Url(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Function to handle AI-generated content
    const handleAiContent = (content: string) => {
        // Insert the AI-generated content at the cursor position or append to the end
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentText = description;
            
            // Insert the content at cursor position or append to the end
            const newText = currentText.substring(0, start) + content + currentText.substring(end);
            setDescription(newText);
            
            // Set focus back to textarea and place cursor after the inserted content
            setTimeout(() => {
                textarea.focus();
                const newCursorPosition = start + content.length;
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }, 0);
        } else {
            // If no cursor position, just append to the end
            setDescription(prev => prev + '\n\n' + content);
        }
        
        toast.success("AI content added!");
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            toast.error("Title and content are required")
            return
        }

        try {
            setIsSubmitting(true)
            const token = localStorage.getItem("token")
            
            if (!token) {
                navigate("/signin")
                return
            }
            
            // Upload image to S3 if available
            let finalImageUrl = null;
            if (imageFile) {
                finalImageUrl = await uploadImageToS3(imageFile);
                if (!finalImageUrl && imageFile) {
                    // If upload failed but we have an image, stop submission
                    setIsSubmitting(false);
                    return;
                }
                setImageS3Url(finalImageUrl);
            }
            
            // Prepare the content with the image
            let finalContent = description;
            if (finalImageUrl) {
                finalContent = `![Blog Image](${finalImageUrl})\n\n${description}`;
            }
            
            // Create the blog post
            const response = await axios.post(`${BACKEND_URL}/api/v1/blog`, {
                title,
                content: finalContent
            }, {
                headers: {
                    "Authorization": token
                }
            })
            
            if (response.data.id) {
                toast.success("Blog published successfully!")
                // Clear the form
                setTitle("")
                setDescription("")
                setImageFile(null)
                setImagePreview(null)
                setImageS3Url(null)
                // Navigate to the new blog post
                navigate(`/blog/${response.data.id}`)
            }
        } catch (error) {
            console.error("Error publishing blog:", error)
            toast.error("Failed to publish blog. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
                        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Story</h1>
                        
                        {/* Title input with floating label */}
                        <div className="mb-6 relative">
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(!title)}
                            />
                            <label 
                                htmlFor="title" 
                                className={`absolute left-4 transition-all duration-200 ${
                                    isFocused || title ? '-top-2.5 text-sm text-blue-500' : 'top-3 text-gray-500'
                                }`}
                            >
                                Title
                            </label>
                        </div>
                        
                        {/* Image upload */}
                        <div className="mb-6">
                            <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Featured Image</p>
                            
                            {/* Show loading indicator when uploading */}
                            {isUploading && (
                                <div className="w-full h-40 border-2 border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="mt-2">Uploading image...</p>
                                </div>
                            )}
                            
                            {/* Show image preview if available */}
                            {imagePreview && !isUploading ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        title="Remove image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                !isUploading && (
                                    <button
                                        onClick={triggerFileInput}
                                        className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="font-medium">Click to add a featured image</p>
                                        <p className="text-sm mt-1">Recommend: 1200×800 or higher, max 5MB</p>
                                    </button>
                                )
                            )}
                            
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        
                        {/* Content textarea */}
                        <div className="mb-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content
                            </label>
                            <div className="relative">
                                <textarea
                                    id="description"
                                    ref={textareaRef}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={12}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Write your blog content here..."
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsAiAssistantOpen(true)}
                                    className="absolute bottom-3 right-3 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded text-sm font-medium transition-colors"
                                >
                                    Write with AI
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Supports Markdown: **bold**, *italic*, [links](url), ![images](url), etc.
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => navigate('/blogs')}
                                className="px-6 py-2 mr-4 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isUploading || !title.trim() || !description.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? "Publishing..." : "Publish"}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* AI Blog Assistant Modal */}
                <AiBlogAssistant 
                    isOpen={isAiAssistantOpen}
                    onClose={() => setIsAiAssistantOpen(false)}
                    onContentGenerated={handleAiContent}
                />
            </div>
        </div>
    );
};
