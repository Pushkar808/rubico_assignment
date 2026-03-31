'use client';

import './globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { boot } = useAuthStore();

  useEffect(() => {
    boot();
  }, [boot]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Rubico — Event & Marketplace Platform</title>
        <meta name="description" content="AI-powered event discovery and marketplace" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
