import type { Metadata, Viewport } from 'next';

import { Providers } from '@/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'Collab', template: '%s · Collab' },
  description: 'AI-powered real-time collaboration platform',
  openGraph: { type: 'website', siteName: 'Collab' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
