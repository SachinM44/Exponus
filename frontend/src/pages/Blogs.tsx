import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBlogs } from '../hooks/useBlogs';
import { BlogCard } from '../components/Blogcard';
import { Blog } from '../types';

export function Blogs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: blogsData, isLoading, error, refetch } = useBlogs({ page: currentPage, pageSize });

  const blogs = blogsData?.blogs ?? [];
  const pagination = blogsData?.pagination;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
    } else {
      setSearchTerm('');
    }
  }, [location.search]);

  const filteredBlogs = useMemo(() => {
    if (!blogs) return [];
    if (!searchTerm.trim()) return blogs;
    
    const query = searchTerm.toLowerCase().trim();
    return blogs.filter((blog: Blog) => 
      blog.title?.toLowerCase().includes(query) || 
      (blog.author?.name && blog.author.name.toLowerCase().includes(query))
    );
  }, [blogs, searchTerm]);

  const navigateToBlog = (id: number) => {
    navigate(`/blog/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Add console log for debugging
  console.log('Blogs.tsx State:', { isLoading, error, blogsData });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        ) : filteredBlogs.length === 0 && !searchTerm && currentPage === 1 ? (
          <div className="text-center my-12 text-gray-500 dark:text-gray-400">
            No blogs have been published yet.
          </div>
        ) : (
          <>
            <div className="space-y-8 max-w-3xl mx-auto">
              {filteredBlogs.map((blog: Blog) => (
                <BlogCard
                  key={blog.id}
                  id={blog.id}
                  authorName={blog.author?.name ?? 'Anonymous'}
                  title={blog.title}
                  publishedDate={blog.createdAt}
                  authorAvatar={blog.author?.avatar}
                  content={blog.content}
                  onClick={() => navigateToBlog(blog.id)}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-700 dark:text-gray-300">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        {!isLoading && !error && filteredBlogs.length === 0 && searchTerm && (
          <div className="text-center my-12 text-gray-500 dark:text-gray-400">
            No blogs found matching "{searchTerm}".
          </div>
        )}
      </main>
    </div>
  );
}
