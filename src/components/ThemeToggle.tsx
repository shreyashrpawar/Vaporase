'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-track">
        <Sun className="theme-toggle-icon sun" />
        <Moon className="theme-toggle-icon moon" />
        <div className="theme-toggle-thumb" />
      </div>
    </button>
  );
}
