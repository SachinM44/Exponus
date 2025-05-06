import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import Avatar from './Avatar';
import { toast } from 'react-hot-toast';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';

const Appbar = () => {
	const { data: user, isLoading } = useUser();
	const location = useLocation();
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState('');
	const [menuOpen, setMenuOpen] = useState(false);

	// Show back button on pages other than home and blogs
	const showBackButton = !['/blogs', '/'].includes(location.pathname);

	// Determine if this is a blog detail page
	const isBlogDetailPage = location.pathname.startsWith('/blog/');

	// Extract search query from URL on initial load
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const query = params.get('q');
		if (query) {
			setSearchQuery(query);
		} else {
			setSearchQuery(''); // Clear search query if not in URL
		}
	}, [location.search]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Navigate to blogs page with search query
		if (searchQuery.trim()) {
			navigate(`/blogs?q=${encodeURIComponent(searchQuery.trim())}`);
		} else {
			navigate('/blogs');
		}
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		// Query invalidation handled by useUser hook onError
		toast.success('Logged out successfully');
		navigate('/signin');
	};

	return (
		<nav className="sticky top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50">
			<div className="w-full px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center flex-shrink-0">
						{showBackButton && (
							<button
								onClick={() => navigate(-1)}
								className="mr-4 p-2 rounded-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
								aria-label="Go back"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
								</svg>
							</button>
						)}
						<Link to="/blogs" className="flex-shrink-0 flex items-center">
							<span className="text-xl font-bold text-gray-900 dark:text-white">Exponus</span>
						</Link>
					</div>

					<div className="flex-1 max-w-lg mx-8">
						<form onSubmit={handleSearch} className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search blogs..."
								className="w-full h-9 pl-4 pr-10 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
							/>
							<button
								type="submit"
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
								aria-label="Search"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</button>
						</form>
					</div>

					<div className="flex items-center space-x-4">
						<ThemeToggle />
						{isLoading ? (
							<div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
						) : user ? (
							<div className="flex items-center space-x-4">
								<Link
									to="/publish"
									className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
								>
									Write
								</Link>
								<div className="relative">
									<button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center focus:outline-none" aria-label="User menu">
										<Avatar name={user.name || user.username} src={user.avatar} size="small" />
									</button>
									{menuOpen && (
										<div
											className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black dark:ring-gray-700 ring-opacity-5"
											role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
										>
											<div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
												<p className="text-sm font-medium text-gray-900 dark:text-white truncate" role="none">{user.name || user.username}</p>
												<p className="text-sm text-gray-500 dark:text-gray-400 truncate" role="none">@{user.username}</p>
											</div>
											<Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
												Edit Profile
											</Link>
											<button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
												Logout
											</button>
										</div>
									)}
								</div>
							</div>
						) : (
							<div className="flex items-center space-x-2">
								<Link to="/signin" className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
									Sign In
								</Link>
								<Link to="/signup" className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
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