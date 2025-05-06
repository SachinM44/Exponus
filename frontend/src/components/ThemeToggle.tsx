import React, { useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
// Remove Redux imports
// import { useAppDispatch, useAppSelector } from '../store/hooks';
// import { toggleTheme, setTheme } from '../store/slices/themeSlice';

export const ThemeToggle: React.FC = () => {
    // Remove Redux hooks
    // const dispatch = useAppDispatch();
    // const currentTheme = useAppSelector((state) => state.theme.mode);
    
    // Placeholder state - Replace with actual theme logic (e.g., context, local storage)
    const [currentTheme, setCurrentThemeState] = React.useState('light'); 

    // Effect to load theme from local storage (example)
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'light';
        setCurrentThemeState(storedTheme);
        document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        // dispatch(setTheme(storedTheme as 'light' | 'dark')); // Remove Redux dispatch
    }, []);

    const handleToggle = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setCurrentThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        // dispatch(toggleTheme()); // Remove Redux dispatch
    };

    return (
        <button
            onClick={handleToggle}
            className="p-2 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
        >
            {currentTheme === 'light' ? (
                <MoonIcon className="h-6 w-6" />
            ) : (
                <SunIcon className="h-6 w-6" />
            )}
        </button>
    );
}; 