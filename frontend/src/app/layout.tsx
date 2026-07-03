import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RentMate AI | Find the Perfect Room & Flatmate',
  description: 'AI-powered room matching and flatmate compatibility platform. Find listings, chat in real-time, and calculate match scores.',
  keywords: 'roommate finder, flatmate matching, rent room, AI roommate matching, real estate, flatmate compatibility',
  openGraph: {
    title: 'RentMate AI | Find the Perfect Room & Flatmate',
    description: 'AI-powered roommate matching with real-time chat and dashboard statistics.',
    type: 'website',
    url: 'https://rentmate.ai',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'RentMate AI Matching Portal',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-[#F8FAFC]">
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
