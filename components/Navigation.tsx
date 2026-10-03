'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Tag, FileText, Calendar, Settings, Linkedin, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Topics', href: '/topics', icon: Tag },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Redirect unauthenticated users to /login after auth state is resolved
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  // Hide nav on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show blank screen while Firebase auth state resolves (prevents flash of protected content)
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
          <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500">
            <Linkedin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">AI Autopilot</h1>
            <p className="text-[11px] text-slate-400 font-medium">LinkedIn Content Engine</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="pt-4 mt-auto border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 rounded-xl text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{user?.email || 'Connected Profile'}</span>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <span>Sign Out</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Navigation */}
        <header className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Linkedin className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-sm text-white">AI Autopilot</span>
          </div>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`p-2 rounded-lg text-xs ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
