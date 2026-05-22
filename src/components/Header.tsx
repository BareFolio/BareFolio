'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import Logo from './Logo';
import { Home, Search, MessageSquare, User, LogOut, Bell, PenSquare, Plus } from 'lucide-react';

interface HeaderProps {
  onCreateClick?: () => void;
}

export default function Header({ onCreateClick }: HeaderProps) {
  const pathname = usePathname();
  const { profile } = useApp();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Post', href: '/posts', icon: PenSquare },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  ];

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-40 glass border-b border-borderGlass shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        {/* LOGO SECT */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center">
            <Logo className="h-6 w-auto block" variant="full" />
          </Link>
          
          {/* NAVIGATION LINKS */}
          <nav className="flex items-center gap-8">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`relative py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full animate-fade-in" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SEARCH AND ACTIONS */}
        <div className="flex items-center gap-6">
          {/* Search bar */}
          <div className="relative w-64 hidden lg:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search what you need"
              className="w-full bg-neutral-100/70 dark:bg-neutral-800/50 pl-10 pr-4 py-2 text-xs rounded-full border border-borderGlass focus:border-accent/40 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all placeholder-neutral-400 font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Create button */}
            {onCreateClick && (
              <button
                onClick={onCreateClick}
                className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create</span>
              </button>
            )}

            {/* Notification alert */}
            <button className="relative p-2 text-text-secondary hover:text-text-primary transition duration-200 cursor-pointer">
              <Bell className="w-4.5 h-4.5 stroke-[1.8]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full"></span>
            </button>

            {/* Profile Avatar */}
            <Link href="/profile/me" className="flex items-center group relative ml-1">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? profile.username}
                  className="w-7.5 h-7.5 rounded-full object-cover border border-neutral-200 dark:border-neutral-800 group-hover:border-accent transition duration-200"
                />
              ) : (
                <div className="w-7.5 h-7.5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs group-hover:bg-accent group-hover:text-white transition duration-200 uppercase font-sans">
                  {(profile?.full_name ?? profile?.username)?.slice(0, 2) || 'ME'}
                </div>
              )}
            </Link>

            <span className="w-px h-4 bg-borderGlass mx-1"></span>

            {/* Log Out */}
            <button
              onClick={handleSignOut}
              className="p-2 text-text-secondary hover:text-red-500 transition duration-200 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4.5 h-4.5 stroke-[1.8]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
