import { useTheme as useNextTheme } from 'next-themes';
import { useEffect } from 'react';

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  useEffect(() => {
    // Ensure the theme class is applied to the document element
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark');
    
    // Apply the resolved theme class
    if (resolvedTheme) {
      root.classList.add(resolvedTheme);
    }
  }, [resolvedTheme]);

  return { theme, setTheme, resolvedTheme };
}
