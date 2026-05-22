'use client';

import { useEffect } from 'react';
import { useStore } from '../lib/store';

const THEME_COLORS: Record<string, { bg: string; surface2: string; accent: string }> = {
  midnight: { bg: '#050505', surface2: '#1a1a1a', accent: '#a78bfa' },
  solar: { bg: '#0f0a06', surface2: '#24180f', accent: '#f59e0b' },
  forest: { bg: '#020f08', surface2: '#082d1c', accent: '#10b981' },
  light: { bg: '#f9fafb', surface2: '#f3f4f6', accent: '#8b5cf6' },
  mono: { bg: '#000000', surface2: '#171717', accent: '#ffffff' },
  sepia: { bg: '#faf3e0', surface2: '#f3ebd3', accent: '#b45309' },
  lavender: { bg: '#f5f3ff', surface2: '#ede9fe', accent: '#7c3aed' },
  ocean: { bg: '#07131f', surface2: '#122c47', accent: '#38bdf8' },
  sage: { bg: '#f4f5f4', surface2: '#e8eae8', accent: '#15803d' },
  mist: { bg: '#0f1115', surface2: '#1c202a', accent: '#94a3b8' }
};

function getFaviconUrl(themeName: string): string {
  const colors = THEME_COLORS[themeName] || THEME_COLORS.midnight;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="ringGrad" cx="50%" cy="50%" r="50%" fx="32%" fy="28%"><stop offset="0%" stop-color="%23ffffff" /><stop offset="25%" stop-color="${colors.accent.replace('#', '%23')}" /><stop offset="72%" stop-color="${colors.surface2.replace('#', '%23')}" /><stop offset="100%" stop-color="${colors.surface2.replace('#', '%23')}" /></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23ringGrad)" /><circle cx="50" cy="50" r="28" fill="${colors.bg.replace('#', '%23')}" fill-opacity="0.85" /></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);

    // Update dynamic themed favicon matching the exact navbar logo design
    const faviconHref = getFaviconUrl(theme);
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = faviconHref;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = faviconHref;
      document.head.appendChild(newLink);
    }
  }, [theme]);

  return <>{children}</>;
}
