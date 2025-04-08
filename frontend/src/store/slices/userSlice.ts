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
  lastFetchTime: number;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  lastFetchTime: 0,
};

// Tracking variables
let isUserProfileBeingFetched = false;
const FETCH_COOLDOWN = 60000; // 60 seconds cooldown between fetches

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Prevent concurrent fetches and limit frequency
      const now = Date.now();
      const state = getState() as { user: UserState };
      
      // If we already have a profile and it's been less than FETCH_COOLDOWN since last fetch, skip
      if (state.user.profile && (now - state.user.lastFetchTime < FETCH_COOLDOWN)) {
        console.log('Skipping duplicate profile fetch - using cached data');
        return state.user.profile;
      }
      
      // If a fetch is already in progress, skip
      if (isUserProfileBeingFetched) {
        console.log('Skipping duplicate profile fetch - fetch in progress');
        return state.user.profile;
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
      console.log('Profile fetched successfully');
      
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
  password?: string;
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
        avatar: params.avatar,
        password: params.password
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
      state.lastFetchTime = 0;
      isUserProfileBeingFetched = false;
    },
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.lastFetchTime = Date.now();
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
            state.lastFetchTime = Date.now();
          }
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        isUserProfileBeingFetched = false;
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
          state.lastFetchTime = Date.now();
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