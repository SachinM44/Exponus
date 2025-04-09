import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import Avatar from './Avatar';
import { useAppDispatch } from '../store/hooks';
import { clearUserState } from '../store/slices/userSlice';
import { toast } from 'react-hot-toast';

const Appbar = () => {
  const { data: user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Show back button on pages other than home and blogs
  const showBackButton = !['/blogs', '/'].includes(location.pathname);
  
  // Determine if this is a blog detail page
  const isBlogDetailPage = location.pathname.startsWith('/blog/');

  return (
    <nav className={`bg-white dark:bg-gray-800 shadow-sm ${isBlogDetailPage ? 'relative z-10' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <Link to="/blogs" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Exponus</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/publish"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Write Blog
                </Link>
                <Link to="/profile" className="flex items-center space-x-2">
                  <Avatar
                    name={user.name || user.username}
                    src={user.avatar || undefined}
                    size="small"
                  />
                  <span className="text-gray-700 dark:text-gray-200">
                    {user.name || user.username}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/signin"
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Appbar;