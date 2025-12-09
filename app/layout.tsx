
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";

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
    <html lang="en">
     

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
