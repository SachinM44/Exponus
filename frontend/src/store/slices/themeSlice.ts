import { createSlice } from '@reduxjs/toolkit';

// Get theme from localStorage or default to 'light'
const getInitialTheme = (): 'dark' | 'light' => {
  const savedTheme = localStorage.getItem('theme');
  
  // Check if user has dark mode preference
  if (savedTheme === 'dark' || 
      (!savedTheme && 
       window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    return 'dark';
  }
  
  document.documentElement.classList.remove('dark');
  return 'light';
};

interface ThemeState {
  mode: 'light' | 'dark';
}

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      
      // Save to localStorage
      localStorage.setItem('theme', state.mode);
      
      // Toggle dark class on html element
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  },
});

export const { toggleTheme } = themeSlice.actions;

export default themeSlice.reducer; 