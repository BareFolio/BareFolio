'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Logo from './Logo';
import { Home, Search, MessageSquare, User, LogOut, Plus, PenSquare } from 'lucide-react';

export default function Sidebar({ onCreateClick }: { onCreateClick: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/', icon: Home },
    { label: 'Posts', href: '/posts', icon: PenSquare },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
    { label: 'Profile', href: '/profile/me', icon: User },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 glass border-r border-borderGlass h-screen sticky top-0 p-6 flex-shrink-0 justify-between">
      <div className="space-y-8">
        <div>
          <Logo className="h-7 w-auto block" variant="full" />
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-2 font-bold font-sans">
            Creative Network
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border border-transparent ${
                  isActive 
                    ? 'bg-accent/10 text-accent font-semibold border-accent/5' 
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={onCreateClick}
            className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3.5 rounded-xl mt-6 shadow-lg shadow-accent/15 transition duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="text-sm">Create</span>
          </button>
        </nav>
      </div>

      <button
        onClick={handleSignOut}
        className="text-left text-xs text-neutral-500 hover:text-red-500 flex items-center gap-3 hover:bg-red-500/5 px-4 py-3.5 rounded-xl transition duration-200 cursor-pointer w-full font-medium"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
