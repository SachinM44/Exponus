import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import Avatar from './Avatar';

const Appbar = () => {
  const { data: user } = useUser();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/blogs" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Exponus</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/publish"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Write Blog
                </Link>
                <Link to="/profile" className="flex items-center space-x-2">
                  <Avatar
                    name={user.name || user.email}
                    src={user.avatar || undefined}
                    size="small"
                  />
                  <span className="text-gray-700 dark:text-gray-200">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/signin"
                  className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
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