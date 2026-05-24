'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/store'
import { useSearchParams } from 'next/navigation'
import type { Message, Profile } from '@/lib/database.types'
import { Search, Bell, MoreHorizontal, Plus, Smile, Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CONVERSATIONS = [
  { id: 'conv-1', name: 'Sandra Rey', role: 'Fashion Designer', initials: 'SR', unread: 3, time: '4 d', preview: "We'd love to discuss a potential coll..." },
  { id: 'conv-2', name: 'Sophie Bennett', role: 'Photographer', initials: 'SB', unread: 3, time: '4 d', preview: 'Eooo I need the new post' },
  { id: 'conv-3', name: 'Ethan Walker', role: 'Art Director', initials: 'EW', unread: 0, time: '4 d', preview: 'We can talk tomorrow?' },
  { id: 'conv-4', name: 'Amelia Scott', role: 'Designer', initials: 'AS', unread: 0, time: 'Sat', preview: 'Sent Saturday' },
]

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
}

const MOCK_COMMUNITIES = [
  { id: 'comm-1', name: 'North Community', handle: 'northstudio', members: 88, initials: 'NC', channels: ['Notifications', 'General', 'Resources'] },
  { id: 'comm-2', name: 'Graphic Design', handle: 'bare.folio', members: 138, initials: 'GD', channels: ['General', 'Resources', 'Showcase'] },
  { id: 'comm-3', name: 'UX / UI', handle: 'bare.folio', members: 2000, initials: 'UX', channels: ['General', 'Resources', 'Jobs'] },
]

const MOCK_CHANNEL_MESSAGES: Record<string, { id: string; sender: string; text: string; mine: boolean }[]> = {
  'General': [
    { id: 'c1', sender: 'North Community', text: 'Welcome to North, a space built around design, visual culture, and creative exploration.\n\nThis community brings together people interested in contemporary aesthetics, ideas, and multidisciplinary creative work across branding, digital design, motion, and visual direction.\n\nA place to share perspectives, processes, and conversations around creativity and evolving visual practices.', mine: false },
  ],
  'Notifications': [
    { id: 'c1', sender: 'me', text: "I'm reaching out to see if you'd be interested in participating in a new project.", mine: false },
    { id: 'c2', sender: 'me', text: "I'd be interested in learning more about.", mine: true },
  ],
  'Resources': [],
}


// ── Component ─────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { currentUser, inboxTab } = useApp()
  const searchParams = useSearchParams()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [selectedId, setSelectedId] = useState<string | null>('conv-1')
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('comm-1')
  const [selectedChannel, setSelectedChannel] = useState<string>('General')
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId, selectedChannel])

  const selectedConv = MOCK_CONVERSATIONS.find(c => c.id === selectedId)
  const selectedComm = MOCK_COMMUNITIES.find(c => c.id === selectedCommunityId)
  const chatMessages = selectedId ? (MOCK_MESSAGES[selectedId] ?? []) : []
  const channelMessages = MOCK_CHANNEL_MESSAGES[selectedChannel] ?? []

  const handleSend = () => {
    if (!newMessage.trim()) return
    setNewMessage('')
  }

  return (
    <div className="flex h-[calc(100vh-128px)] border border-neutral-200 rounded-2xl overflow-hidden bg-white">

      {/* ── Column 1: Left sidebar ── */}
      <div className="w-1/3 flex-shrink-0 border-r border-neutral-100 flex flex-col bg-[#FAFAFA]">

        {/* Search */}
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

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {inboxTab === 'messages' && (
            <>
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-semibold text-text-primary">Messages</span>
                <button className="text-xs font-semibold text-[#5B5BD6] cursor-pointer">Requests (1)</button>
              </div>

              {/* Notifications item */}
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
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedId === conv.id ? 'bg-neutral-100' : 'hover:bg-white'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center flex-shrink-0 text-xs font-bold text-neutral-600 uppercase">
                    {conv.initials}
                  </div>
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

              {/* Notifications item */}
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
                  onClick={() => { setSelectedCommunityId(comm.id); setSelectedChannel('General'); setSelectedId(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedCommunityId === comm.id && selectedId !== 'notifications' ? 'bg-neutral-100' : 'hover:bg-white'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5B5BD6] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold uppercase">
                    {comm.initials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-text-primary truncate">{comm.name}</p>
                    <p className="text-xs text-neutral-400">By @{comm.handle}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 flex-shrink-0">{comm.members >= 1000 ? `${(comm.members / 1000).toFixed(0)}k` : comm.members} <span className="text-neutral-300">⚇</span></span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Column 2: Community channels (only when communities tab) ── */}
      {inboxTab === 'communities' && selectedComm && (
        <div className="w-1/3 flex-shrink-0 border-r border-neutral-100 flex flex-col bg-white">
          {/* Community header */}
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

          {/* Channels */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2 mb-2">Channels</p>
            {selectedComm.channels.map(ch => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${selectedChannel === ch ? 'bg-neutral-100 font-semibold text-text-primary' : 'text-neutral-500 hover:bg-neutral-50 hover:text-text-primary'}`}
              >
                {ch === 'Notifications' && <Bell className="w-4 h-4 flex-shrink-0" />}
                {ch === 'General' && <span className="w-4 h-4 flex-shrink-0 text-center text-xs">💬</span>}
                {ch === 'Resources' && <span className="w-4 h-4 flex-shrink-0 text-center text-xs">📁</span>}
                {ch === 'Showcase' && <span className="w-4 h-4 flex-shrink-0 text-center text-xs">🖼</span>}
                {ch === 'Jobs' && <span className="w-4 h-4 flex-shrink-0 text-center text-xs">💼</span>}
                {ch}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Column 3: Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Messages chat view */}
        {inboxTab === 'messages' && selectedId && selectedConv && (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase flex-shrink-0">
                {selectedConv.initials}
              </div>
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
                    <div className="w-7 h-7 rounded-full bg-neutral-300 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-neutral-600 uppercase">
                      {selectedConv.initials}
                    </div>
                  )}
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${msg.mine ? 'bg-[#101010] text-white rounded-br-sm' : 'bg-neutral-100 text-text-primary rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 px-4 py-3 border-t border-neutral-100">
              <button type="button" className="text-neutral-400 hover:text-text-primary cursor-pointer flex-shrink-0">
                <Plus className="w-5 h-5" />
              </button>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Search what you need"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none"
              />
              <button type="button" className="text-neutral-400 hover:text-text-primary cursor-pointer flex-shrink-0">
                <Smile className="w-5 h-5" />
              </button>
              <button type="button" className="text-neutral-400 hover:text-text-primary cursor-pointer flex-shrink-0">
                <Mic className="w-5 h-5" />
              </button>
            </form>
          </>
        )}

        {/* Community channel view */}
        {inboxTab === 'communities' && selectedComm && (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100">
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
                    <div className="w-9 h-9 rounded-xl bg-[#101010] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold uppercase">
                      {selectedComm.initials}
                    </div>
                  )}
                  <div className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${msg.mine ? 'bg-[#101010] text-white' : 'bg-neutral-50 text-text-primary'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3 px-4 py-3 border-t border-neutral-100">
              <button type="button" className="text-neutral-400 hover:text-text-primary cursor-pointer flex-shrink-0">
                <Plus className="w-5 h-5" />
              </button>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Search what you need"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none"
              />
              <button type="button" className="text-neutral-400 hover:text-text-primary cursor-pointer flex-shrink-0">
                <Smile className="w-5 h-5" />
              </button>
              <button type="button" className="text-neutral-400 hover:text-text-primary cursor-pointer flex-shrink-0">
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
  )
}
