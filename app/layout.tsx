import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AACG Platform - Mechanics Liens & Photo AI',
  description: 'Enterprise platform for mechanics liens, photo AI analysis, and legal workflows powered by 20 AI agents',
  keywords: ['mechanics liens', 'photo ai', 'legal workflows', 'ai agents', 'construction'],
  authors: [{ name: 'AACG Team' }],
  creator: 'Scott',
  openGraph: {
    title: 'AACG Platform',
    description: 'Enterprise platform for construction and legal workflows',
    type: 'website',
    url: 'https://aacg-platform.up.railway.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Enterprise platform for mechanics liens, photo AI, and legal workflows" />
      </head>
      <body>
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  );
}
