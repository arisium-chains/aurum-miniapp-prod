import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aurum Circle - AI-Powered Social Discovery',
  description:
    'Join the future of social discovery with AI-powered matching and authenticity verification.',
  keywords: ['social', 'AI', 'discovery', 'authenticity', 'verification'],
  authors: [{ name: 'Aurum Circle Team' }],
  openGraph: {
    title: 'Aurum Circle - AI-Powered Social Discovery',
    description:
      'Join the future of social discovery with AI-powered matching and authenticity verification.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aurum Circle - AI-Powered Social Discovery',
    description:
      'Join the future of social discovery with AI-powered matching and authenticity verification.',
  },
};

/**
 * @description Root layout component for the landing page application
 * @param children React children components
 * @returns JSX element containing the complete HTML structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}
