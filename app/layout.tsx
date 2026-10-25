import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ClientProviders from './components/ClientProviders';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'JobMatch AI | Smart ATS Resume Builder & Job Match Scanner',
  description:
    'Build ATS-optimized resumes, comprehensive CVs, and AI cover letters. Evaluate keyword matching and formatting readiness with instant, client-side diagnostics.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'JobMatch AI | Smart ATS Resume Builder & Job Match Platform',
    description:
      'Create recruiter-ready, ATS-friendly resumes and CVs with instant keyword diagnostics.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#07090e] text-slate-100 min-h-screen`}
        suppressHydrationWarning
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
