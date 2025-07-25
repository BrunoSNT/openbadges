import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

export function ThemeDebug() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-background border border-border rounded p-2 text-xs z-50">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>HTML class: {document.documentElement.className}</div>
    </div>
  );
}
