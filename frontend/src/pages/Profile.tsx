import { useState, useEffect, ChangeEvent, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate, Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { useUser, useUpdateUserProfile, useGetPresignedUrl, UserProfile } from "../hooks/useUser";
import { useUserBlogs } from "../hooks/useBlogs";
import { format } from 'date-fns';

export const Profile = () => {
  const { data: currentUser, isLoading: userLoading, error: userError } = useUser();
  const updateProfileMutation = useUpdateUserProfile();
  const getPresignedUrlMutation = useGetPresignedUrl();
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Add state for blog pagination
  const [blogPage, setBlogPage] = useState(1);
  const { data: userBlogsData, isLoading: blogsLoading } = useUserBlogs(
    currentUser?.id || 0,
    { page: blogPage, pageSize: 5 }
  );

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setAvatarPreview(currentUser.avatar || null);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/signin');
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file.");
          return;
      }
      if (file.size > 5 * 1024 * 1024) {
          toast.error("Image file size should be less than 5MB.");
          return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = (): boolean => {
    setPasswordError("");
    
    if (!name.trim()) {
      toast.error("Name is required");
      return false;
    }
    
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match");
        toast.error("Passwords do not match");
        return false;
      }
      
      if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        toast.error("Password must be at least 6 characters");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If there's an avatar file, upload it first
      let avatarUrl = currentUser?.avatar;

      if (avatarFile) {
        // Get presigned URL
        const presignedData = await getPresignedUrlMutation.mutateAsync({
          contentType: avatarFile.type,
          filename: avatarFile.name
        });
        
        // Upload to S3
        await axios.put(presignedData.presignedUrl, avatarFile, {
          headers: {
            "Content-Type": avatarFile.type,
          },
        });

        // Set the new avatar URL
        avatarUrl = presignedData.objectUrl;
      }

      // Update profile with type-safe avatar value
      await updateProfileMutation.mutateAsync({
        name: name || undefined,
        bio: bio || undefined,
        avatar: avatarUrl || undefined
      });

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen dark:bg-gray-900">
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </div>
    );
  }

  if (userError) {
     return (
         <div className="min-h-screen dark:bg-gray-900">
             <div className="flex justify-center items-center min-h-[calc(100vh-64px)] text-red-500">
               Error loading profile: {userError.message}
             </div>
         </div>
     );
  }
  
  if (!currentUser) {
      return (
           <div className="min-h-screen dark:bg-gray-900">
             <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
               Please sign in to view your profile.
             </div>
         </div>
      );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold dark:text-white">Edit Profile</h1>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center md:w-1/3">
              <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
              </div>
              <input 
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                id="avatar-upload"
                className="hidden"
                disabled={isSubmitting}
              />
              <label 
                htmlFor="avatar-upload"
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium ${isSubmitting ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'} transition-colors mb-2`}
              >
                Change Avatar
              </label>
              {avatarPreview && (
                  <button 
                      type="button" 
                      onClick={() => { 
                          setAvatarPreview(null); 
                          setAvatarFile(null); 
                      }}
                      disabled={isSubmitting}
                      className={`text-sm ${isSubmitting ? 'text-gray-500 cursor-not-allowed' : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'} transition-colors`}
                  >
                      Remove Avatar
                  </button>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input 
                    type="text"
                    id="username"
                    value={currentUser.username}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input 
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white disabled:opacity-70"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <textarea 
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white disabled:opacity-70"
                    placeholder="Tell us a little about yourself"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                  <>
                      <span className="inline-block h-4 w-4 border-t-2 border-white border-r-2 rounded-full animate-spin mr-2"></span>
                      Saving...
                  </>
              ) : (
                  'Save Changes'
              )}
            </button>
          </div>
        </form>
        
        {/* My Blogs Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Blogs</h2>
          
          {blogsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner message="Loading your blogs..." />
            </div>
          ) : userBlogsData?.blogs && userBlogsData.blogs.length > 0 ? (
            <div className="space-y-6">
              {userBlogsData.blogs.map(blog => (
                <div key={blog.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                  <Link to={`/blog/${blog.id}`} className="block group">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {blog.createdAt ? format(new Date(blog.createdAt), 'MMMM d, yyyy') : ''}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                      {blog.content.replace(/!\[.*?\]\(.*?\)/g, '').substring(0, 150)}...
                    </p>
                  </Link>
                  <div className="flex gap-2 mt-3">
                    <Link 
                      to={`/blog/${blog.id}`} 
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded transition-colors"
                    >
                      Read
                    </Link>
                    {/* Add Edit button in the future if needed */}
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {userBlogsData.pagination && userBlogsData.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setBlogPage(prev => Math.max(1, prev - 1))}
                    disabled={blogPage <= 1}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {userBlogsData.pagination.currentPage} of {userBlogsData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setBlogPage(prev => Math.min(userBlogsData.pagination.totalPages, prev + 1))}
                    disabled={blogPage >= userBlogsData.pagination.totalPages}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-4">You haven't published any blogs yet.</p>
              <Link 
                to="/publish" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Your First Blog
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 