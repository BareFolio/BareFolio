'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Layers, Search, Inbox } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function TabBar({ onCreateClick }: { onCreateClick: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile } = useApp();

  const hasActiveChat = searchParams.has('chat') || searchParams.has('channel');

  if (pathname === '/inbox' && hasActiveChat) {
    return null;
  }

  const navItems = [
    { label: 'Feed', href: '/home', icon: Home },
    { label: 'Posts', href: '/posts', icon: Layers },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Inbox', href: '/inbox', icon: Inbox },
    { label: 'Profile', href: '/profile/me', isProfile: true },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#FAFAFA]/75 dark:bg-neutral-900/75 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 dark:border-neutral-800/30 shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-center justify-between gap-1 max-w-sm w-[90%] transition-all duration-300">
      {navItems.map((item, index) => {
        const isProfile = item.isProfile;
        const isActive = isProfile 
          ? pathname.startsWith('/profile') 
          : (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href!));

        if (isProfile) {
          return (
            <Link
              key={index}
              href="/profile/me"
              className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-100 dark:border-neutral-700 px-5 py-2.5 scale-105'
                  : 'px-3.5 py-2.5'
              }`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className={`w-6 h-6 rounded-full object-cover transition-all ${
                    isActive ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'opacity-85 hover:opacity-100'
                  }`}
                />
              ) : (
                <div className={`w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[9px] uppercase transition-all ${
                  isActive ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'opacity-85'
                }`}>
                  {(profile?.full_name ?? profile?.username)?.slice(0, 2) || 'ME'}
                </div>
              )}
            </Link>
          );
        }

        const Icon = item.icon!;
        return (
          <Link
            key={index}
            href={item.href!}
            className={`flex items-center justify-center rounded-full transition-all duration-300 ${
              isActive
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-100 dark:border-neutral-700 px-5 py-2.5 scale-105'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-3.5 py-2.5'
            }`}
          >
            <Icon 
              className={`w-5 h-5 transition-all duration-300 ${
                isActive 
                  ? 'stroke-[2.5] text-neutral-950 dark:text-white scale-105' 
                  : 'stroke-[2] text-neutral-500 dark:text-neutral-400 hover:scale-105'
              }`} 
            />
          </Link>
        );
      })}
    </div>
  );
}

