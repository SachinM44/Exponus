import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlogs } from '../hooks/useBlogs';
import BlogCard from '../components/Blogcard';
import Appbar from '../components/Appbar';
import { toast } from 'react-hot-toast';

export function Blogs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: blogs, isLoading, error, refetch } = useBlogs();

  const filteredBlogs = useMemo(() => {
    if (!blogs) return [];
    return blogs.filter(blog =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blogs, searchTerm]);

  const navigateToBlog = (id: number) => {
    navigate(`/blog/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Appbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

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
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center my-12 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No blogs match your search.' : 'No blogs have been published yet.'}
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

