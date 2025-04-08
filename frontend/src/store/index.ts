import { configureStore } from '@reduxjs/toolkit';
import blogReducer from './slices/blogSlice';
import themeReducer from './slices/themeSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    blogs: blogReducer,
    theme: themeReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store };
export default store; 