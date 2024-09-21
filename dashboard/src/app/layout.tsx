import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from 'next/link';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "infrastack-interview-fs-fk",
  description: "infrastack-interview-fs-fk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="bg-navbar-bg shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-foreground text-lg font-semibold">
                  Service Dashboard
                </Link>
                <Link href="/traces" className="ml-4 text-foreground text-lg font-semibold">
                  Traces
                </Link>
                <Link href="/logs" className="ml-4 text-foreground text-lg font-semibold">
                  Logs
                </Link>
                <Link href="/metrics" className="ml-4 text-foreground text-lg font-semibold">
                  Metrics
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
