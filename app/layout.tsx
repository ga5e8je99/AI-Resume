
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Suppress hydration mismatch warnings from browser extensions
  useEffect(() => {
    // Remove extension-added attributes that cause hydration mismatches
    const bodyElement = document.body;
    if (bodyElement.hasAttribute("cz-shortcut-listen")) {
      bodyElement.removeAttribute("cz-shortcut-listen");
    }
  }, []);
 
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>JobMatch | AI Resume Builder & ATS Scanner</title>
        <meta name="description" content="AI-Powered ATS Resume Builder & Job Match Scanner" />
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/icons/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="theme-color" content="#020617" />
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <ScrollToTop/>
        </AuthProvider>
      </body>
    </html>
  );
}
