"use client";

import { ThemeProvider } from '@/contexts/ThemeContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}