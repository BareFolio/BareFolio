'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import Logo from './Logo';
import { Home, Search, MessageSquare, PenSquare, Plus, SlidersHorizontal, LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onCreateClick?: () => void;
}

export default function Header({ onCreateClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, feedTab, setFeedTab, inboxTab, setInboxTab, postsTab, setPostsTab, setFilterDrawerOpen } = useApp();
  const isHome = pathname === '/';
  const isExplore = pathname === '/explore';
  const isInbox = pathname === '/inbox';
  const isPosts = pathname === '/posts';

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Post', href: '/posts', icon: PenSquare },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  ];

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-40 glass border-b border-borderGlass shadow-sm items-center h-[72px] px-8">

        {/* LEFT: Logo symbol + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex-shrink-0">
            <Logo variant="symbol" className="h-6 w-6" />
          </Link>

          <nav className="flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${
                    isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* CENTER: tab toggle — absolutely centered */}
        {(isHome || isInbox || isPosts) && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <div className="flex items-center bg-neutral-100 rounded-full p-0.5 gap-0.5">
              {isHome && (
                <>
                  <button onClick={() => setFeedTab('all')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${feedTab === 'all' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>All</button>
                  <button onClick={() => setFeedTab('forYou')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${feedTab === 'forYou' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>For you</button>
                </>
              )}
              {isInbox && (
                <>
                  <button onClick={() => setInboxTab('messages')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${inboxTab === 'messages' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Messages</button>
                  <button onClick={() => setInboxTab('communities')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${inboxTab === 'communities' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Communities</button>
                </>
              )}
              {isPosts && (
                <>
                  <button onClick={() => setPostsTab('everyone')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${postsTab === 'everyone' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Everyone</button>
                  <button onClick={() => setPostsTab('following')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${postsTab === 'following' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Following</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* RIGHT: Search + Actions */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <div className={`relative ${isExplore ? 'hidden' : 'hidden lg:flex'} items-center`}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search what you need"
              className="w-52 bg-neutral-100/80 pl-9 pr-9 py-2 text-xs rounded-full border border-borderGlass focus:border-accent/40 focus:bg-white focus:outline-none transition-all placeholder-neutral-400 font-sans"
            />
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {isInbox && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#101010] text-white text-xs font-semibold hover:bg-neutral-700 transition-all duration-200 cursor-pointer flex-shrink-0">
              New chat
            </button>
          )}

          {onCreateClick && !isInbox && (
            <button
              onClick={onCreateClick}
              className="p-2 rounded-full bg-[#101010] text-white hover:bg-neutral-700 transition-all duration-200 cursor-pointer flex items-center justify-center flex-shrink-0"
              title="Create"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 text-text-secondary hover:text-text-primary transition duration-200 cursor-pointer flex-shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          </button>

          <Link href="/profile/me" className="flex items-center group flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? profile.username}
                className="w-8 h-8 rounded-full object-cover border border-neutral-200 group-hover:border-accent transition duration-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs group-hover:bg-accent group-hover:text-white transition duration-200 uppercase">
                {(profile?.full_name ?? profile?.username)?.slice(0, 2) || 'ME'}
              </div>
            )}
          </Link>

          <span className="w-px h-4 bg-borderGlass" />

          <button
            onClick={handleSignOut}
            className="p-2 text-text-secondary hover:text-red-500 transition duration-200 cursor-pointer flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE HEADER (Víctor's Mockup) */}
      {!isInbox && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-neutral-200/10 flex items-center justify-between h-16 px-4 select-none">
        
        {/* Left: Plus button to create */}
        <button
          onClick={onCreateClick}
          className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Center: Custom tab selector pill */}
        {isHome ? (
          <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-full border border-neutral-300/10 shadow-inner">
            <button
              onClick={() => setFeedTab('forYou')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                feedTab === 'forYou'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              For you
            </button>
            <button
              onClick={() => setFeedTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                feedTab === 'all'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All
            </button>
          </div>
        ) : isPosts ? (
          <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-full border border-neutral-300/10 shadow-inner">
            <button
              onClick={() => setPostsTab('everyone')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                postsTab === 'everyone'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => setPostsTab('following')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                postsTab === 'following'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Following
            </button>
          </div>
        ) : (
          <span className="font-display font-black text-sm uppercase tracking-widest text-[#101010]">
            {pathname === '/explore' ? 'Explore' : pathname === '/inbox' ? 'Inbox' : 'BareFolio'}
          </span>
        )}

        {/* Right: Sliders Filter button */}
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <SlidersHorizontal className="w-4.5 h-4.5 stroke-[2]" />
        </button>
      </header>
      )}
    </>
  );
}
