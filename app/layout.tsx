import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'LinkedIn AI Autopilot — AI Content Automation for LinkedIn',
  description: 'Automate high-impact LinkedIn technical content generation, visual design, scheduling, and official publishing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <Navigation>{children}</Navigation>
        </AuthProvider>
      </body>
    </html>
  );
}
