/**
 * ThemeContext - Manages theme state
 * Handles dark/light mode and theme preferences
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [accentColor, setAccentColor] = useState('blue');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      try {
        const { isDark, accent } = JSON.parse(savedTheme);
        setIsDarkMode(isDark);
        setAccentColor(accent);
      } catch (err) {
        console.error('Error loading theme:', err);
      }
    }

    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(
        STORAGE_KEYS.THEME,
        JSON.stringify({ isDark: newValue, accent: accentColor })
      );
      return newValue;
    });
  }, [accentColor]);

  const updateAccentColor = useCallback((color) => {
    setAccentColor(color);
    localStorage.setItem(
      STORAGE_KEYS.THEME,
      JSON.stringify({ isDark: isDarkMode, accent: color })
    );
  }, [isDarkMode]);

  const value = {
    isDarkMode,
    accentColor,
    toggleTheme,
    updateAccentColor,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
