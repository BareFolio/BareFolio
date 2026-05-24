'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  const sqlMigration = `-- 0. Drop old tables to avoid column mismatches and recreate cleanly
drop table if exists public.community_messages cascade;
drop table if exists public.communities cascade;
drop table if exists public.applications cascade;
drop table if exists public.messages cascade;
drop table if exists public.chats cascade;
drop table if exists public.briefs cascade;
drop table if exists public.posts cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

-- 1. Profiles Table (profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text check (role in ('seeker', 'creator', 'studio', 'brand')) not null,
  bio text,
  location text,
  avatar_url text,
  is_pro boolean default false,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Questionnaire fields
  username text,
  practice text,
  disciplines text[] default array[]::text[],
  availability_status text,
  verification_file_url text,
  company_name text,
  company_link text,
  team_size text,
  verification_method text,
  verification_data text,
  industry text,
  disciplines_hiring text[] default array[]::text[],
  is_verified boolean default false
);

alter table public.profiles enable row level security;
drop policy if exists "Profiles publicly visible" on public.profiles;
create policy "Profiles publicly visible" on public.profiles for select using (true);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Projects Table (projects)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  creator_name text not null,
  title text not null,
  description text,
  palette_hex text[] default array[]::text[],
  technique text not null,
  mood text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;
drop policy if exists "Projects publicly visible" on public.projects;
create policy "Projects publicly visible" on public.projects for select using (true);
drop policy if exists "Creators update own projects" on public.projects;
create policy "Creators update own projects" on public.projects for all using (auth.uid() = creator_id);

-- 3. Short Posts Table (posts)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;
drop policy if exists "Posts publicly visible" on public.posts;
create policy "Posts publicly visible" on public.posts for select using (true);
drop policy if exists "Creators update own posts" on public.posts;
create policy "Creators update own posts" on public.posts for all using (auth.uid() = creator_id);

-- 4. Briefs Table (briefs)
create table if not exists public.briefs (
  id uuid default gen_random_uuid() primary key,
  studio_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  budget text not null,
  modality text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.briefs enable row level security;
drop policy if exists "Briefs publicly visible" on public.briefs;
create policy "Briefs publicly visible" on public.briefs for select using (true);
drop policy if exists "Studios update own briefs" on public.briefs;
create policy "Studios update own briefs" on public.briefs for all using (auth.uid() = studio_id);

-- 5. Chat Threads Table (chats)
create table if not exists public.chats (
  id uuid default gen_random_uuid() primary key,
  members uuid[] not null,
  member_names text[] not null,
  last_message text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chats enable row level security;
drop policy if exists "Chats visible to members" on public.chats;
create policy "Chats visible to members" on public.chats for select using (auth.uid() = any(members));
drop policy if exists "Members manage own chats" on public.chats;
create policy "Members manage own chats" on public.chats for all using (auth.uid() = any(members));

-- 6. Direct Messages Table (messages)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
drop policy if exists "Direct messages visible to chat members" on public.messages;
create policy "Direct messages visible to chat members" on public.messages for select using (
  exists (select 1 from public.chats where id = chat_id and auth.uid() = any(members))
);
drop policy if exists "Members send direct messages" on public.messages;
create policy "Members send direct messages" on public.messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from public.chats where id = chat_id and auth.uid() = any(members))
);

-- 7. Applications Table (applications)
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  brief_id uuid references public.briefs(id) on delete cascade not null,
  brief_title text not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  creator_name text not null,
  note text not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.applications enable row level security;
drop policy if exists "Applications visible to owner and studios" on public.applications;
create policy "Applications visible to owner and studios" on public.applications for select using (
  auth.uid() = creator_id or exists (select 1 from public.briefs b where b.id = brief_id and b.studio_id = auth.uid())
);
drop policy if exists "Creators apply to briefs" on public.applications;
create policy "Creators apply to briefs" on public.applications for insert with check (auth.uid() = creator_id);
drop policy if exists "Studios update applications" on public.applications;
create policy "Studios update applications" on public.applications for update using (
  exists (select 1 from public.briefs b where b.id = brief_id and b.studio_id = auth.uid())
);

-- 8. Communities Table (communities)
create table if not exists public.communities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.communities enable row level security;
drop policy if exists "Communities publicly visible" on public.communities;
create policy "Communities publicly visible" on public.communities for select using (true);
drop policy if exists "Members create communities" on public.communities;
create policy "Members create communities" on public.communities for insert with check (auth.uid() = created_by);

-- 9. Community Messages Table (community_messages)
create table if not exists public.community_messages (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.community_messages enable row level security;
drop policy if exists "Community messages visible" on public.community_messages;
create policy "Community messages visible" on public.community_messages for select using (true);
drop policy if exists "Members send community messages" on public.community_messages;
create policy "Members send community messages" on public.community_messages for insert with check (auth.uid() = sender_id);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlMigration);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 py-12">
      <div className="max-w-2xl w-full glass p-8 rounded-3xl shadow-xl flex flex-col items-center border border-borderGlass space-y-6">
        
        {/* Header Icon */}
        <div className="w-16 h-16 bg-[#3ECF8E]/10 text-[#3ECF8E] rounded-full flex items-center justify-center shadow-inner">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="text-center">
          <h1 className="text-3xl font-display font-black tracking-tight text-neutral-900 dark:text-white">Configure BareFolio Backend</h1>
          <p className="text-xs text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
            BareFolio utilizes **Supabase** (PostgreSQL) for accounts, visual portfolios, Twitter/Instagram-style posts, creative briefs, direct DMs, and community group chats.
          </p>
        </div>

        {/* Local ENV copy container */}
        <div className="w-full text-left bg-neutral-100 dark:bg-neutral-900/60 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-borderGlass text-neutral-800 dark:text-neutral-200">
          <p className="text-neutral-400 font-sans text-[10px] mb-1 uppercase tracking-wider font-bold">1. Set up a local .env.local file with:</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key</p>
        </div>

        {/* Step by step guide */}
        <div className="w-full space-y-4">
          <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">2. Configuration Guide</h4>
          
          <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[#3ECF8E] text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
              <p>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-accent underline font-semibold">supabase.com</a> and provision a free PostgreSQL database project.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[#3ECF8E] text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
              <p>Copy the **Project URL** and the **API key (anon public)** from Project Settings ➔ API and drop them in your local `.env.local` file.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[#3ECF8E] text-white rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
              <p>Open the **SQL Editor** inside your Supabase dashboard, click "New Query", paste the migration script below, and hit **Run**.</p>
            </div>
          </div>
        </div>

        {/* SQL Script Container */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">3. SQL Migration Script</h4>
            <button 
              onClick={copyToClipboard}
              className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-accent dark:hover:text-accent font-bold text-[10px] px-3 py-1.5 rounded-lg border border-borderGlass cursor-pointer active:scale-95 transition-all"
            >
              {copied ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>

          <div className="w-full h-36 bg-neutral-100 dark:bg-neutral-900/60 p-3 rounded-2xl font-mono text-[10px] overflow-y-auto border border-borderGlass text-neutral-500 max-h-40">
            <pre>{sqlMigration}</pre>
          </div>
        </div>

        {/* Troubleshooting and Limit Bypasses */}
        <div className="w-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 p-4 rounded-2xl text-xs space-y-2 text-left">
          <h4 className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            ⚠️ Having Rate Limits, Access Issues, or Local Email constraints?
          </h4>
          <p className="leading-relaxed">
            The free tier on Supabase has highly restrictive safety boundaries (such as a generic SMTP SMTP limit of 3 messages/hour) that will raise <code className="bg-amber-500/15 dark:bg-amber-500/20 px-1 py-0.5 rounded font-mono text-[10px] text-amber-700 dark:text-amber-300">Email not confirmed</code> or rate-limit blocks.
          </p>
          <p className="leading-relaxed font-semibold">
            To bypass all email limits and register accounts instantly:
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Open your **Supabase Dashboard**.</li>
            <li>Go to **Authentication** ➔ **Providers** ➔ **Email**.</li>
            <li>Disable the **Confirm email** toggle.</li>
            <li>Click **Save**. You can now register and sign in instantaneously using any email and handle social login (Google/Apple) without SMTP limits.</li>
          </ol>
        </div>

        {/* Reload button */}
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-[#3ECF8E] hover:bg-[#32B87D] text-white font-bold py-3 px-6 rounded-xl transition duration-200 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-95 text-sm"
        >
          I have set the variables, reload page
        </button>

      </div>
    </div>
  );
}
