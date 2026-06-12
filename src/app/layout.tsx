import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import { ThemeProvider } from "../components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AssetFlow - Smart Asset Management & Resource Allocation",
  description: "Cultural Council - IIT Roorkee Shared Asset Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Anti-flash: apply saved theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('assetflow-theme');
                var el = document.documentElement;
                if (t === 'light') {
                  el.classList.remove('dark');
                  el.classList.add('light');
                } else {
                  el.classList.add('dark');
                  el.classList.remove('light');
                }
              } catch(e) {}
            `,
          }}
        />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
