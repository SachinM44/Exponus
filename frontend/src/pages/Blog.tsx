import React, { useEffect, useState, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Appbar from "../components/Appbar"
import { FullBlog } from "../components/FullBlog"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { fetchBlog } from "../store/slices/blogSlice"

export const Blog = () => {
    const { id } = useParams<{ id: string }>()
    const blogId = useMemo(() => parseInt(id || "0"), [id])
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Get the selected blog from the redux store
    const selectedBlog = useAppSelector(state => {
        // First check the current blog
        if (state.blogs.currentBlog && state.blogs.currentBlog.id === blogId) {
            return state.blogs.currentBlog;
        }
        // Otherwise look in the items array
        return state.blogs.items.find(blog => blog.id === blogId);
    })
    
    // Format the author name
    const authorName = useMemo(() => {
        if (!selectedBlog) return ""
        return selectedBlog.author.name || selectedBlog.author.email
    }, [selectedBlog])
    
    // Fetch the blog data
    const fetchBlogData = useCallback(async () => {
        if (!blogId) {
            setError("Invalid blog ID")
            setLoading(false)
            return
        }
        
        try {
            setLoading(true)
            await dispatch(fetchBlog(blogId.toString())).unwrap()
            setLoading(false)
        } catch (error) {
            console.error("Error fetching blog:", error)
            setError("Failed to load blog. It may have been deleted or you don't have permission to view it.")
            setLoading(false)
        }
    }, [dispatch, blogId])
    
    // Initial blog fetch
    useEffect(() => {
        fetchBlogData()
    }, [fetchBlogData])
    
    // Handle retry button click
    const handleRetry = useCallback(() => {
        setError(null)
        fetchBlogData()
    }, [fetchBlogData])
    
    // Navigate back to blogs
    const handleBackToBlog = useCallback(() => {
        navigate("/blogs")
    }, [navigate])
    
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Appbar />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }
    
    if (error || !selectedBlog) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Appbar />
                <div className="max-w-lg mx-auto mt-16 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Blog Not Found
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        {error || "This blog post could not be found."}
                    </p>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleBackToBlog}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                        >
                            Back to Blogs
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <FullBlog
                title={selectedBlog.title}
                content={selectedBlog.content}
                authorName={authorName}
                publishedDate={selectedBlog.createdAt}
                blogId={selectedBlog.id}
                authorId={selectedBlog.authorId}
                authorAvatar={selectedBlog.author.avatar || undefined}
            />
        </div>
    )
}

export default Blog;