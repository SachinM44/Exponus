import Appbar from "../components/Appbar";
import { useState, useEffect, ChangeEvent, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import { useAppDispatch } from '../store/hooks';
import { updateUserProfile } from '../store/slices/userSlice';

interface UserProfile {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/v1/profile`,
        {
          headers: {
            Authorization: token
          }
        }
      );

      const userData = response.data.user;
      setProfile(userData);
      
      // If user has an avatar, set the preview
      if (userData.avatar) {
        setAvatarPreview(userData.avatar);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
      
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Token expired or invalid
        localStorage.removeItem("token");
        navigate("/signin");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setRemoveAvatar(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveAvatar = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      await axios.delete(`${BACKEND_URL}/api/v1/profile/avatar`, {
        headers: { Authorization: token }
      });
      
      setAvatarPreview(null);
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        avatar: undefined
      }));
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove avatar");
    }
  };

  const validateForm = (): boolean => {
    // Reset error
    setPasswordError("");
    
    // Check if name is provided
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    
    // Check if passwords match when changing password
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

  const handleSubmit = async () => {
    // When using password, make sure they match
    if (password && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");

    setSaving(true);
    try {
      // Prepare update data
      const updateData: Record<string, string> = { 
        name: profile.name 
      };
      
      // Add optional fields if provided
      if (password) {
        updateData.password = password;
      }
      
      if (profile.bio) {
        updateData.bio = profile.bio;
      }
      
      // Handle avatar separately since it can be null/removed
      let avatarValue: string | undefined = undefined;
      if (removeAvatar) {
        // For the API call we'll handle null differently
        await handleRemoveAvatar();
      } else if (avatarPreview && avatarPreview !== profile.avatar) {
        avatarValue = avatarPreview;
      }
      
      // Dispatch update action
      await dispatch(updateUserProfile({ 
        name: profile.name,
        password: password || undefined,
        bio: profile.bio,
        avatar: avatarValue
      }));
      
      toast.success("Profile updated successfully!");
      
      // Clear password fields after update
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-900">
        <Appbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <Appbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-300">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Username and Bio Section */}
              <div className="w-full max-w-xs text-center">
                <h2 className="text-xl font-semibold dark:text-white mb-2">
                  {profile.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {profile.bio ? (
                    profile.bio.length > 60 ? `${profile.bio.substring(0, 60)}...` : profile.bio
                  ) : 'No bio yet'}
                </p>
              </div>
              
              <div className="flex flex-col space-y-2 mt-4">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center">
                  Upload Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                </label>
                
                {(avatarPreview || profile.avatar) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={saving}
                    className="py-2 px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors focus:outline-none dark:border-red-400 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
            
            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Your name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="bio" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleInputChange}
                  maxLength={60}
                  className="w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Write a short bio (max 60 characters)"
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {profile.bio ? profile.bio.length : 0}/60 characters
                </p>
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full p-2.5 text-sm text-gray-500 bg-gray-100 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border ${
                    passwordError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white`}
                  placeholder="Confirm new password"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="inline-block h-4 w-4 border-t-2 border-white border-r-2 rounded-full animate-spin mr-2"></span>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 