import type { Metadata, Viewport } from 'next';
import { siteName, siteUrl } from '@/lib/env';
import { fontVariables } from '@/lib/fonts';
import { THEME_META_COLORS, themeInitScript } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s — ${siteName}` },
  description:
    'An archive of the writing of Triyan — poetry, philosophical and existential work in English and Hindi.',
  applicationName: siteName,
  authors: [{ name: 'Triyan' }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: THEME_META_COLORS.void },
    { media: '(prefers-color-scheme: light)', color: THEME_META_COLORS.manuscript },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/*
          Resolves the persisted environment before first paint. Without it a reader
          who prefers MANUSCRIPT would see a flash of the void.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-(--z-nav) focus-visible:bg-surface focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
