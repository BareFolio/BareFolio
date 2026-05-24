'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import { useSearchParams } from 'next/navigation';
import type { Message, Profile } from '@/lib/database.types';
import { Search, Bell, MoreHorizontal, Plus, Smile, Mic, ChevronLeft, ChevronRight, Info, MessageSquare, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Mock data with Unsplash high-fidelity photo portraits ────────────────────────────────
const MOCK_CONVERSATIONS = [
  { 
    id: 'conv-1', 
    name: 'Sandra Rey', 
    role: 'Fashion Designer', 
    initials: 'SR', 
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 
    unread: 3, 
    time: '4 d', 
    preview: "We'd love to discuss a potential coll..." 
  },
  { 
    id: 'conv-2', 
    name: 'Sophie Bennett', 
    role: 'Photographer', 
    initials: 'SB', 
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', 
    unread: 3, 
    time: '4 d', 
    preview: 'Eooo I need the new post' 
  },
  { 
    id: 'conv-3', 
    name: 'Ethan Walker', 
    role: 'Art Director', 
    initials: 'EW', 
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 
    unread: 0, 
    time: '4 d', 
    preview: 'We can talk tomorrow?' 
  },
  { 
    id: 'conv-4', 
    name: 'Amelia Scott', 
    role: 'Designer', 
    initials: 'AS', 
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 
    unread: 0, 
    time: 'Sat', 
    preview: 'Sent Saturday' 
  },
  { 
    id: 'conv-5', 
    name: 'Lucas Hayes', 
    role: '3D Artist', 
    initials: 'LH', 
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', 
    unread: 0, 
    time: 'Sat', 
    preview: 'Sent Saturday' 
  },
];

const MOCK_MESSAGES: Record<string, { id: string; sender: string; text: string; mine: boolean }[]> = {
  'conv-1': [
    { id: 'm1', sender: 'Sandra Rey', text: "Hi, I'm Sandra.\nI'm reaching out to see if you'd be interested in participating in a new fashion project.", mine: false },
    { id: 'm2', sender: 'me', text: 'Hi Sandra.', mine: true },
    { id: 'm3', sender: 'me', text: "I'd be interested in learning more about.", mine: true },
  ],
  'conv-2': [
    { id: 'm1', sender: 'Sophie Bennett', text: 'Eooo I need the new post', mine: false },
  ],
  'conv-3': [
    { id: 'm1', sender: 'Ethan Walker', text: 'We can talk tomorrow?', mine: false },
  ],
  'conv-4': [
    { id: 'm1', sender: 'me', text: 'Sent Saturday', mine: true },
  ],
  'conv-5': [
    { id: 'm1', sender: 'me', text: 'Sent Saturday', mine: true },
  ],
};

const MOCK_COMMUNITIES = [
  { id: 'comm-1', name: 'North Community', handle: 'northstudio', members: 88, initials: 'NC', channels: ['Notifications', 'General', 'Resources'] },
  { id: 'comm-2', name: 'Graphic Design', handle: 'bare.folio', members: 138, initials: 'GD', channels: ['General', 'Resources', 'Showcase'] },
  { id: 'comm-3', name: 'UX / UI', handle: 'bare.folio', members: 2000, initials: 'UX', channels: ['General', 'Resources', 'Jobs'] },
];

const MOCK_CHANNEL_MESSAGES: Record<string, { id: string; sender: string; text: string; mine: boolean }[]> = {
  'General': [
    { id: 'c1', sender: 'North Community', text: 'Welcome to North, a space built around design, visual culture, and creative exploration.\n\nThis community brings together people interested in contemporary aesthetics, ideas, and multidisciplinary creative work across branding, digital design, motion, and visual direction.\n\nA place to share perspectives, processes, and conversations around creativity and evolving visual practices.', mine: false },
  ],
  'Notifications': [
    { id: 'c1', sender: 'me', text: "I'm reaching out to see if you'd be interested in participating in a new project.", mine: false },
    { id: 'c2', sender: 'me', text: "I'd be interested in learning more about.", mine: true },
  ],
  'Resources': [],
};

export default function InboxPage() {
  const { currentUser, inboxTab, setInboxTab } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>('conv-1');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('comm-1');
  const [selectedChannel, setSelectedChannel] = useState<string>('General');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile navigation state
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'channels'>('list');

  const chatParam = searchParams.get('chat');
  const communityParam = searchParams.get('community');
  const channelParam = searchParams.get('channel');

  // URL query parameter synchronization
  useEffect(() => {
    if (chatParam) {
      setSelectedId(chatParam);
      setSelectedCommunityId('');
      setMobileView('chat');
    } else if (communityParam) {
      setSelectedCommunityId(communityParam);
      setSelectedId(null);
      if (channelParam) {
        setSelectedChannel(channelParam);
        setMobileView('chat');
      } else {
        setMobileView('channels');
      }
    } else {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSelectedId('conv-1');
      } else {
        setSelectedId(null);
      }
      setMobileView('list');
    }
  }, [chatParam, communityParam, channelParam]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, selectedChannel, mobileView]);

  const selectedConv = MOCK_CONVERSATIONS.find(c => c.id === selectedId);
  const selectedComm = MOCK_COMMUNITIES.find(c => c.id === selectedCommunityId);
  const chatMessages = selectedId ? (MOCK_MESSAGES[selectedId] ?? []) : [];
  const channelMessages = MOCK_CHANNEL_MESSAGES[selectedChannel] ?? [];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const msgId = 'new-msg-' + Date.now();
    const msgObj = { id: msgId, sender: 'me', text: newMessage, mine: true };

    if (selectedId) {
      if (!MOCK_MESSAGES[selectedId]) MOCK_MESSAGES[selectedId] = [];
      MOCK_MESSAGES[selectedId].push(msgObj);
    } else if (selectedChannel) {
      if (!MOCK_CHANNEL_MESSAGES[selectedChannel]) MOCK_CHANNEL_MESSAGES[selectedChannel] = [];
      MOCK_CHANNEL_MESSAGES[selectedChannel].push(msgObj);
    }

    setNewMessage('');
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <>
      {/* ── DESKTOP VIEW LAYOUT ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex h-[calc(100vh-128px)] border border-neutral-200 rounded-2xl overflow-hidden bg-white">
        {/* Column 1: Threads Sidebar */}
        <div className="w-1/3 flex-shrink-0 border-r border-neutral-100 flex flex-col bg-[#FAFAFA]">
          {/* Search bar */}
          <div className="px-4 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search what you need"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-full pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto">
            {inboxTab === 'messages' && (
              <>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-semibold text-text-primary">Messages</span>
                  <button className="text-xs font-semibold text-[#5B5BD6] cursor-pointer hover:underline">Requests (1)</button>
                </div>

                {/* Notifications link */}
                <button
                  onClick={() => router.push('/notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedId === 'notifications' ? 'bg-neutral-100' : 'hover:bg-white'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 relative">
                    <Bell className="w-4 h-4 text-neutral-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#5B5BD6] rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                    <p className="text-xs text-neutral-400 truncate">North Studio start following you</p>
                  </div>
                </button>

                {/* Conversations */}
                {MOCK_CONVERSATIONS.filter(c =>
                  !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => router.push(`/inbox?chat=${conv.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedId === conv.id ? 'bg-neutral-100' : 'hover:bg-white'}`}
                  >
                    {conv.avatarUrl ? (
                      <img
                        src={conv.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center flex-shrink-0 text-xs font-bold text-neutral-600 uppercase">
                        {conv.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary truncate">{conv.name}</p>
                        <span className="text-[10px] text-neutral-400 flex-shrink-0 ml-2">{conv.time}</span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{conv.preview}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 bg-[#5B5BD6] rounded-full text-[10px] text-white font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}

            {inboxTab === 'communities' && (
              <>
                <div className="px-4 py-2">
                  <span className="text-sm font-semibold text-text-primary">Communities</span>
                </div>

                {/* Notifications link */}
                <button
                  onClick={() => router.push('/notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedId === 'notifications' ? 'bg-neutral-100' : 'hover:bg-white'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 relative">
                    <Bell className="w-4 h-4 text-neutral-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#5B5BD6] rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                    <p className="text-xs text-neutral-400 truncate">North Studio start following you</p>
                  </div>
                </button>

                {MOCK_COMMUNITIES.map(comm => (
                  <button
                    key={comm.id}
                    onClick={() => router.push(`/inbox?community=${comm.id}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedCommunityId === comm.id && !selectedId ? 'bg-neutral-100' : 'hover:bg-white'}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#5B5BD6] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold uppercase">
                      {comm.initials}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-text-primary truncate">{comm.name}</p>
                      <p className="text-xs text-neutral-400">By @{comm.handle}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">
                      {comm.members >= 1000 ? `${(comm.members / 1000).toFixed(0)}k` : comm.members} <span className="text-neutral-300">⚇</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Column 2: Community Channels (communities tab) */}
        {inboxTab === 'communities' && selectedComm && (
          <div className="w-1/3 flex-shrink-0 border-r border-neutral-100 flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#101010] flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0">
                  {selectedComm.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{selectedComm.name}</p>
                  <p className="text-[11px] text-neutral-400">By @{selectedComm.handle}</p>
                </div>
              </div>
              <button className="text-neutral-400 hover:text-text-primary cursor-pointer p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2 mb-2">Channels</p>
              {selectedComm.channels.map(ch => (
                <button
                  key={ch}
                  onClick={() => router.push(`/inbox?community=${selectedCommunityId}&channel=${ch}`)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${selectedChannel === ch ? 'bg-neutral-100 font-semibold text-text-primary' : 'text-neutral-500 hover:bg-neutral-50 hover:text-text-primary'}`}
                >
                  {ch === 'Notifications' && <Info className="w-4 h-4 flex-shrink-0 text-neutral-500" />}
                  {ch === 'General' && <MessageSquare className="w-4 h-4 flex-shrink-0 text-neutral-500" />}
                  {ch === 'Resources' && <Folder className="w-4 h-4 flex-shrink-0 text-neutral-500" />}
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Column 3: Chat Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
          {/* Direct message view */}
          {selectedId && selectedConv && (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 bg-white">
                {selectedConv.avatarUrl ? (
                  <img
                    src={selectedConv.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase flex-shrink-0">
                    {selectedConv.initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-text-primary">{selectedConv.name}</p>
                  <p className="text-xs text-neutral-400">{selectedConv.role}</p>
                </div>
                <button className="ml-auto text-neutral-400 hover:text-text-primary cursor-pointer p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!msg.mine && (
                      selectedConv.avatarUrl ? (
                        <img
                          src={selectedConv.avatarUrl}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-neutral-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-neutral-300 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-neutral-600 uppercase">
                          {selectedConv.initials}
                        </div>
                      )
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                      msg.mine 
                        ? 'bg-neutral-200 text-[#101010] rounded-br-sm' 
                        : 'bg-neutral-100 text-text-primary rounded-bl-sm border border-neutral-200/40'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 px-4 py-3 border-t border-neutral-100 bg-white">
                <button type="button" className="text-neutral-400 hover:text-[#101010] cursor-pointer flex-shrink-0 p-1">
                  <Plus className="w-5 h-5" />
                </button>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none"
                />
                <button type="button" className="text-neutral-400 hover:text-[#101010] cursor-pointer flex-shrink-0 p-1">
                  <Smile className="w-5 h-5" />
                </button>
                <button type="button" className="text-neutral-400 hover:text-[#101010] cursor-pointer flex-shrink-0 p-1">
                  <Mic className="w-5 h-5" />
                </button>
              </form>
            </>
          )}

          {/* Community channel message view */}
          {!selectedId && inboxTab === 'communities' && selectedComm && (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 bg-white">
                <div className="w-8 h-8 rounded-lg bg-[#101010] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {selectedComm.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{selectedChannel}</p>
                  <p className="text-xs text-neutral-400">{selectedComm.name}</p>
                </div>
                <button className="ml-auto text-neutral-400 hover:text-text-primary cursor-pointer p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {channelMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} items-start gap-3`}>
                    {!msg.mine && (
                      <div className="w-9 h-9 rounded-xl bg-[#101010] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                        {selectedComm.initials}
                      </div>
                    )}
                    <div className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                      msg.mine 
                        ? 'bg-neutral-200 text-[#101010]' 
                        : 'bg-white border border-neutral-200/50 text-text-primary'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 px-4 py-3 border-t border-neutral-100 bg-white">
                <button type="button" className="text-neutral-400 hover:text-[#101010] cursor-pointer flex-shrink-0 p-1">
                  <Plus className="w-5 h-5" />
                </button>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none"
                />
                <button type="button" className="text-neutral-400 hover:text-[#101010] cursor-pointer flex-shrink-0 p-1">
                  <Smile className="w-5 h-5" />
                </button>
                <button type="button" className="text-neutral-400 hover:text-[#101010] cursor-pointer flex-shrink-0 p-1">
                  <Mic className="w-5 h-5" />
                </button>
              </form>
            </>
          )}

          {/* Empty state */}
          {!selectedId && inboxTab === 'messages' && (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE VIEW LAYOUT (Víctor's Mockup) ─────────────────────────────────── */}
      <div className="md:hidden fixed inset-0 z-30 flex flex-col bg-[#FAFAFA] text-[#101010] select-none">
        
        {/* Custom Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-neutral-200/20 flex items-center justify-between h-16 px-4 select-none">
          {mobileView === 'list' && (
            <>
              {/* Left spacer for centering tabs */}
              <div className="w-10 flex-shrink-0" />
              
              {/* Center switcher */}
              <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-full border border-neutral-300/10 shadow-inner">
                <button
                  onClick={() => setInboxTab('messages')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                    inboxTab === 'messages'
                      ? 'bg-white text-[#101010] shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Messages
                </button>
                <button
                  onClick={() => setInboxTab('communities')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                    inboxTab === 'communities'
                      ? 'bg-white text-[#101010] shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Communities
                </button>
              </div>

              {/* Right Plus button */}
              <button className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </>
          )}

          {mobileView === 'channels' && (
            <>
              {/* Left Back button */}
              <button
                onClick={() => router.push('/inbox')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              {/* Center Community identity */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#101010] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  {selectedComm?.initials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-text-primary leading-tight">{selectedComm?.name}</p>
                  <p className="text-[10px] text-neutral-400">By @{selectedComm?.handle}</p>
                </div>
              </div>

              {/* Right dots */}
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </>
          )}

          {mobileView === 'chat' && (
            <>
              {/* Left Back button */}
              <button
                onClick={() => {
                  if (selectedId) {
                    router.push('/inbox');
                  } else {
                    router.push(`/inbox?community=${selectedCommunityId}`);
                  }
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              {/* Center Chat title */}
              {selectedId ? (
                <div className="flex items-center gap-2.5">
                  {selectedConv?.avatarUrl ? (
                    <img
                      src={selectedConv.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-300 text-neutral-600 flex items-center justify-center font-bold text-xs uppercase border border-neutral-200">
                      {selectedConv?.initials}
                    </div>
                  )}
                  <p className="text-sm font-bold text-text-primary leading-tight">{selectedConv?.name}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#101010] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {selectedComm?.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-text-primary leading-tight">{selectedChannel}</p>
                    <p className="text-[10px] text-neutral-400">By @{selectedComm?.handle}</p>
                  </div>
                </div>
              )}

              {/* Right dots */}
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-[#101010] active:scale-95 transition-all cursor-pointer flex-shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </>
          )}
        </header>

        {/* Mobile Page Content Flow */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {mobileView === 'list' && (
            <div className="flex-1 flex flex-col pb-24">
              {/* Search bar */}
              <div className="px-4 pt-16 pb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search what you need"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-100 border border-neutral-200/35 rounded-full pl-5 pr-10 py-2.5 text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-300 transition-all font-sans"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Messages Flow */}
              {inboxTab === 'messages' && (
                <>
                  <div className="flex items-center justify-between px-5 py-2 mt-1">
                    <span className="text-xl font-black text-[#101010] tracking-tight">Messages</span>
                    <button className="text-xs font-bold text-[#5B5BD6] cursor-pointer hover:underline">Requests (1)</button>
                  </div>

                  {/* Bell notifications card */}
                  <button
                    onClick={() => router.push('/notifications')}
                    className="w-[92%] mx-auto mt-3 flex items-center gap-3.5 px-4 py-3 bg-neutral-100 hover:bg-neutral-200/40 rounded-2xl transition-all border border-neutral-200/20 text-left select-none cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-300/70 flex items-center justify-center flex-shrink-0 relative shadow-sm">
                      <Bell className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">Notifications</p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">North Studio start following you</p>
                    </div>
                    <span className="w-5 h-5 bg-[#5B5BD6] rounded-full text-[10px] text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#5B5BD6]/20">3</span>
                  </button>

                  {/* Chats list */}
                  <div className="px-4 py-3 space-y-2.5">
                    {MOCK_CONVERSATIONS.filter(c =>
                      !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => router.push(`/inbox?chat=${conv.id}`)}
                        className="w-full flex items-center gap-3 px-3 py-3 bg-white rounded-2xl transition-all hover:bg-neutral-50 border border-neutral-200/30 text-left select-none cursor-pointer shadow-sm shadow-black/[0.01]"
                      >
                        {conv.avatarUrl ? (
                          <img
                            src={conv.avatarUrl}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-neutral-200/60 flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-neutral-300 flex items-center justify-center flex-shrink-0 text-xs font-bold text-neutral-600 uppercase border border-neutral-200/60 shadow-sm">
                            {conv.initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-text-primary truncate">{conv.name}</p>
                            <span className="text-[10px] text-neutral-400 flex-shrink-0 ml-2 font-medium">{conv.time}</span>
                          </div>
                          <p className="text-xs text-neutral-400 truncate mt-0.5 leading-snug">{conv.preview}</p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="w-5 h-5 bg-[#5B5BD6] rounded-full text-[10px] text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#5B5BD6]/20">
                            {conv.unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Communities Flow */}
              {inboxTab === 'communities' && (
                <>
                  <div className="flex items-center px-5 py-2 mt-1">
                    <span className="text-xl font-black text-[#101010] tracking-tight">Communities</span>
                  </div>

                  {/* Bell Notifications thread */}
                  <button
                    onClick={() => router.push('/notifications')}
                    className="w-[92%] mx-auto mt-3 flex items-center gap-3.5 px-4 py-3 bg-neutral-100 hover:bg-neutral-200/40 rounded-2xl transition-all border border-neutral-200/20 text-left select-none cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-300/70 flex items-center justify-center flex-shrink-0 relative shadow-sm">
                      <Bell className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">Notifications</p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">North Studio start following you</p>
                    </div>
                    <span className="w-5 h-5 bg-[#5B5BD6] rounded-full text-[10px] text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#5B5BD6]/20">3</span>
                  </button>

                  {/* Communities list */}
                  <div className="px-4 py-3 space-y-2.5">
                    {MOCK_COMMUNITIES.map(comm => (
                      <button
                        key={comm.id}
                        onClick={() => router.push(`/inbox?community=${comm.id}`)}
                        className="w-full flex items-center gap-3 px-3 py-3 bg-white rounded-2xl transition-all hover:bg-neutral-50 border border-neutral-200/30 text-left select-none cursor-pointer shadow-sm shadow-black/[0.01]"
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#101010] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase shadow-sm">
                          {comm.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">{comm.name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">By @{comm.handle}</p>
                        </div>
                        <span className="text-[10px] text-neutral-400 flex-shrink-0 bg-neutral-100 px-2.5 py-0.5 rounded-full font-bold">
                          {comm.members >= 1000 ? `${(comm.members / 1000).toFixed(0)}k` : comm.members} ⚇
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {mobileView === 'channels' && (
            <div className="px-4 pt-16 pb-28 space-y-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 px-2">Channels</p>
              <div className="space-y-2.5">
                {selectedComm?.channels.map(ch => (
                  <button
                    key={ch}
                    onClick={() => router.push(`/inbox?community=${selectedCommunityId}&channel=${ch}`)}
                    className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-neutral-200/40 hover:bg-neutral-50 transition-all text-left select-none cursor-pointer shadow-sm shadow-black/[0.01]"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 flex-shrink-0 shadow-inner">
                      {ch === 'Notifications' && <Info className="w-5 h-5 text-neutral-500" />}
                      {ch === 'General' && <MessageSquare className="w-5 h-5 text-neutral-500" />}
                      {ch === 'Resources' && <Folder className="w-5 h-5 text-neutral-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary leading-tight">{ch}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {ch === 'Notifications' && 'Calls and Advertisment'}
                        {ch === 'General' && 'Text · open to all members'}
                        {ch === 'Resources' && 'Resources · links & files'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {mobileView === 'chat' && (
            <div className="flex-1 flex flex-col pt-16 pb-24 min-h-[calc(100vh-160px)] relative">
              {/* Messages bubble feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white min-h-[calc(100vh-240px)]">
                {(selectedId ? chatMessages : channelMessages).map(msg => (
                  <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} items-end gap-2.5`}>
                    {!msg.mine && (
                      selectedId ? (
                        selectedConv?.avatarUrl ? (
                          <img
                            src={selectedConv.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-neutral-200 flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-neutral-300 flex items-center justify-center text-[10px] font-bold text-neutral-600 uppercase flex-shrink-0 shadow-sm">
                            {selectedConv?.initials}
                          </div>
                        )
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[#101010] text-white flex items-center justify-center font-bold text-[9px] uppercase flex-shrink-0 shadow-sm">
                          {selectedComm?.initials}
                        </div>
                      )
                    )}
                    
                    <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                      msg.mine 
                        ? 'bg-neutral-200 text-[#101010] rounded-[20px] rounded-br-[4px]' 
                        : 'bg-neutral-100 text-text-primary rounded-[20px] rounded-bl-[4px] border border-neutral-200/20'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Floating Bar */}
              <form 
                onSubmit={e => { e.preventDefault(); handleSend(); }} 
                className="fixed bottom-0 left-0 right-0 border-t border-neutral-200/50 bg-[#FAFAFA]/95 backdrop-blur-md px-4 pt-3 pb-safe flex items-center gap-3.5 z-40"
              >
                <button type="button" className="text-neutral-600 hover:text-[#101010] active:scale-95 transition cursor-pointer p-0.5">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message"
                  className="flex-1 bg-neutral-200/50 border border-neutral-300/10 rounded-full px-5 py-2.5 text-sm text-[#101010] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-300 transition-all font-sans"
                />
                <button type="button" className="text-neutral-600 hover:text-[#101010] active:scale-95 transition cursor-pointer p-0.5">
                  <Mic className="w-5 h-5 stroke-[2.5]" />
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
