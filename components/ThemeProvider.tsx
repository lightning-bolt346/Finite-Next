'use client';

import { useEffect } from 'react';
import { useStore } from '../lib/store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
