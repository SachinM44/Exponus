import React, { useState, useRef, useEffect } from "react"
import Appbar from "../components/Appbar"
import axios from "axios"
import { BACKEND_URL } from "../config"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

export const Publish = () => {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const navigate = useNavigate()

    // Insert an image into the content if it's not already included
    const insertImageIntoContent = () => {
        if (imagePreview && !description.includes(imagePreview)) {
            return `![Blog Image](${imagePreview})\n\n${description}`
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
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

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
            
            // Prepare the content with the image
            const finalContent = insertImageIntoContent()
            
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
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <Appbar />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Story</h1>
                        
                        {/* Title input with floating label */}
                        <div className="mb-6 relative">
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="block w-full px-4 py-3 text-2xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500 dark:text-white transition-colors"
                                placeholder=""
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
                        
                        {/* Featured image section */}
                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Featured Image</p>
                            
                            {imagePreview ? (
                                <div className="relative">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                        aria-label="Remove image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
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
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell your story..."
                                className="w-full min-h-[300px] p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white resize-y"
                                rows={10}
                            ></textarea>
                            
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
                                disabled={isSubmitting || !title.trim() || !description.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? "Publishing..." : "Publish"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
