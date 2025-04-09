import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBlogs } from '../hooks/useBlogs';
import { BlogCard } from '../components/Blogcard';
import Appbar from '../components/Appbar';
import { toast } from 'react-hot-toast';
import { useAppDispatch } from '../store/hooks';
import { fetchLikes } from '../store/slices/blogSlice';

export function Blogs() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: blogs, isLoading, error, refetch } = useBlogs();

  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
    } else {
      setSearchTerm('');
    }
  }, [location.search]);

  // Fetch likes for all blogs when the component mounts
  useEffect(() => {
    if (blogs && blogs.length > 0) {
      // Fetch likes for all blogs
      blogs.forEach(blog => {
        dispatch(fetchLikes(blog.id));
      });
    }
  }, [blogs, dispatch]);

  const filteredBlogs = useMemo(() => {
    if (!blogs) return [];
    if (!searchTerm.trim()) return blogs;
    
    const query = searchTerm.toLowerCase().trim();
    return blogs.filter(blog => 
      // Search by title
      blog.title.toLowerCase().includes(query) || 
      // Search by content
      blog.content.toLowerCase().includes(query) || 
      // Search by author name or email
      (blog.author.name && blog.author.name.toLowerCase().includes(query)) ||
      blog.author.email.toLowerCase().includes(query)
    );
  }, [blogs, searchTerm]);

  const navigateToBlog = (id: number) => {
    navigate(`/blog/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Appbar />
      <main className="container mx-auto px-4 py-8">
        {searchTerm && (
          <div className="mb-8 text-center">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {filteredBlogs.length > 0 
                ? `Found ${filteredBlogs.length} result${filteredBlogs.length === 1 ? '' : 's'} for "${searchTerm}"`
                : `No results found for "${searchTerm}"`}
            </h2>
            {filteredBlogs.length === 0 && (
              <button
                onClick={() => navigate('/blogs')}
                className="mt-2 text-blue-500 hover:text-blue-600"
              >
                Clear search
              </button>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center my-12 text-red-500 dark:text-red-400">
            <p>Failed to load blogs. Please try again later.</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredBlogs.length === 0 && !searchTerm ? (
          <div className="text-center my-12 text-gray-500 dark:text-gray-400">
            No blogs have been published yet.
          </div>
        ) : (
          <div className="space-y-8 max-w-3xl mx-auto">
            {filteredBlogs.map(blog => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                authorName={blog.author.name || blog.author.email}
                title={blog.title}
                content={blog.content}
                publishedDate={blog.createdAt}
                onClick={() => navigateToBlog(blog.id)}
                authorAvatar={blog.author.avatar || undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

