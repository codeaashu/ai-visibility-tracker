import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Visibility Tracker",
  description: "Track how your SaaS product appears in AI recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    AI Visibility Tracker
                  </span>
                </Link>
                <div className="flex space-x-6">
                  <Link
                    href="/"
                    className="text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/brands"
                    className="text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Brands
                  </Link>
                  <Link
                    href="/scans"
                    className="text-slate-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Scans
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
