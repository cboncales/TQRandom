import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false);

  // Apply theme to document
  const applyTheme = () => {
    const htmlElement = document.documentElement;
    
    if (isDarkMode.value) {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', isDarkMode.value.toString());
    
    // Debug log
    console.log('Theme applied:', isDarkMode.value ? 'dark' : 'light');
    console.log('HTML classes:', htmlElement.classList.toString());
  };

  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme !== null) {
      isDarkMode.value = savedTheme === 'true';
    } else {
      // Check system preference
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Apply immediately
    applyTheme();
  };

  // Toggle theme
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    applyTheme();
  };

  // Watch for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only update if user hasn't manually set a preference
      if (localStorage.getItem('darkMode') === null) {
        isDarkMode.value = e.matches;
        applyTheme();
      }
    });
  }

  return {
    isDarkMode,
    initTheme,
    toggleTheme,
  };
});