'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageSquare, User, PenSquare } from 'lucide-react';

export default function TabBar({ onCreateClick }: { onCreateClick: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/', icon: Home },
    { label: 'Posts', href: '/posts', icon: PenSquare },
    { label: 'Create', onClick: onCreateClick, icon: Plus, isCreate: true },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
    { label: 'Profile', href: '/profile/me', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-borderGlass z-50 px-4 pb-safe flex justify-around items-center h-20 shadow-2xl">
      {navItems.map((item, index) => {
        const IconComponent = item.icon;
        
        if (item.isCreate) {
          return (
            <button
              key={index}
              onClick={item.onClick}
              className="w-12 h-12 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/25 active:scale-95 transition-all cursor-pointer"
            >
              <IconComponent className="w-6 h-6 stroke-[2.5]" />
            </button>
          );
        }

        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href || ''}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${
              isActive ? 'text-accent scale-105' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <IconComponent className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
