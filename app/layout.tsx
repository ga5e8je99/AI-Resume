import type { Metadata, Viewport } from 'next';
import { Newsreader, Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import ClientProviders from './components/ClientProviders';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const ibmPlexArabic = localFont({
  src: [
    {
      path: '../public/fonts/ibm-plex-sans-arabic/IBMPlexSansArabic-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/ibm-plex-sans-arabic/IBMPlexSansArabic-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/ibm-plex-sans-arabic/IBMPlexSansArabic-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-resume-rho.vercel.app'),
  title: {
    default: 'JobMatch AI - A Resume That Gets Read',
    template: '%s | JobMatch AI',
  },
  description:
    'Build cleanly formatted, ATS-compliant resumes, comprehensive CVs, and targeted cover letters. In-browser scanning and honest keyword diagnostics.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'JobMatch AI - A Resume That Gets Read',
    description:
      'Editorial typography, precise document layouts, and in-browser ATS parsing. Built for job seekers who care about craft.',
    url: 'https://ai-resume-rho.vercel.app',
    siteName: 'JobMatch AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JobMatch AI - Quality Paper & Ink Editorial Resume Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobMatch AI - A Resume That Gets Read',
    description:
      'Editorial typography, precise document layouts, and in-browser ATS parsing.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F4' },
    { media: '(prefers-color-scheme: dark)', color: '#0C100E' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-paper text-ink">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('jobmatch_theme');
                var isDark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                var root = document.documentElement;
                if (isDark) {
                  root.setAttribute('data-theme', 'dark');
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                } else {
                  root.setAttribute('data-theme', 'light');
                  root.classList.remove('dark');
                  root.style.colorScheme = 'light';
                }
                var lang = null;
                if (typeof window !== 'undefined' && window.location.search) {
                  var urlParams = new URLSearchParams(window.location.search);
                  var qLang = urlParams.get('lang');
                  if (qLang && ['en', 'ar', 'fr', 'de', 'es', 'tr'].indexOf(qLang) !== -1) {
                    lang = qLang;
                  }
                }
                if (!lang) {
                  var m = document.cookie.match(/(?:^|; )jobmatch_user_language=([^;]+)/);
                  if (m) lang = decodeURIComponent(m[1]);
                }
                if (!lang) {
                  lang = localStorage.getItem('jobmatch_user_language');
                }
                if (!lang && typeof navigator !== 'undefined' && navigator.language) {
                  var nav = navigator.language.toLowerCase();
                  var match = ['ar', 'fr', 'de', 'es', 'tr', 'en'].find(function(c) { return nav.startsWith(c); });
                  if (match) lang = match;
                }
                if (lang === 'ar') {
                  root.setAttribute('lang', 'ar');
                  root.setAttribute('dir', 'rtl');
                  root.classList.add('rtl');
                } else {
                  root.setAttribute('lang', lang || 'en');
                  root.setAttribute('dir', 'ltr');
                  root.classList.remove('rtl');
                }
              } catch (e) { /* Ignore storage access errors in restricted browser environments */ }
            })();`,
          }}
        />
      </head>
      <body
        className={`${newsreader.variable} ${inter.variable} ${ibmPlexArabic.variable} ${jetbrainsMono.variable} antialiased bg-paper text-ink min-h-[100dvh] flex flex-col selection:bg-brand-soft selection:text-ink font-sans`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-on-brand focus:font-medium focus:rounded-[6px] focus:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Skip to main content
        </a>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
