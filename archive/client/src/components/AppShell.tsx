import type { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { ThemedToaster } from '@/components/ThemedToaster';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-bg flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-app-accent px-4 py-2 text-sm font-semibold text-white opacity-0 pointer-events-none transition focus:translate-y-0 focus:opacity-100 focus:pointer-events-auto focus:outline-none focus:ring-2 focus:ring-app-accent/50"
      >
        Skip to main content
      </a>
      <Navigation />
      {children}
      <ThemedToaster />
    </div>
  );
}
