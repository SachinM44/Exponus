import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../lib/apiClient';

interface UserProfile {
  id: number;
  name: string | null;
  username: string;  // Changed from email to username
  avatar: string | null;
  bio: string | null;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

// Tracking variables
let isUserProfileBeingFetched = false;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 10000; // 10 seconds cooldown between fetches

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      // Prevent concurrent fetches and limit frequency
      const now = Date.now();
      if (isUserProfileBeingFetched || (now - lastFetchTime < FETCH_COOLDOWN)) {
        console.log('Skipping duplicate profile fetch');
        return null; // Return null to indicate skipped fetch
      }
      
      isUserProfileBeingFetched = true;
      console.log('Fetching user profile from API');
      
      const token = localStorage.getItem('token');
      if (!token) {
        isUserProfileBeingFetched = false;
        return rejectWithValue('No token found');
      }

      const response = await apiClient.get('/api/v1/user/profile');

      isUserProfileBeingFetched = false;
      lastFetchTime = Date.now();
      console.log('Profile fetched successfully:', response.data);
      
      return response.data;
    } catch (error) {
      isUserProfileBeingFetched = false;
      return rejectWithValue('Failed to fetch profile');
    }
  }
);

interface UpdateProfileParams {
  name: string;
  bio?: string;
  avatar?: string;
}

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (params: UpdateProfileParams, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      // Create update data object from params
      const updateData: Record<string, string | undefined> = {
        name: params.name,
        bio: params.bio,
        avatar: params.avatar
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await apiClient.put('/api/v1/user/profile', updateData);

      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to update profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserState: (state) => {
      state.profile = null;
      state.error = null;
      lastFetchTime = 0;
    },
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile | null>) => {
          state.loading = false;
          if (action.payload) {
            state.profile = action.payload;
          }
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.loading = false;
          state.profile = action.payload;
        }
      )
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserState, setUserProfile } = userSlice.actions;
export default userSlice.reducer; 