'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/store'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Conversation, Message, Profile } from '@/lib/database.types'
import { Send, MessageSquare } from 'lucide-react'

interface ConversationWithDetails extends Omit<Conversation, 'last_message'> {
  other_participant: Profile | null
  last_message: Message | null
}

export default function InboxPage() {
  const { currentUser } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [inboxTab, setInboxTab] = useState<'chats' | 'communities'>('chats')
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  )
  const [messages, setMessages] = useState<(Message & { sender: Profile | null })[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (!currentUser) return
    loadConversations()
  }, [currentUser])

  useEffect(() => {
    if (!selectedConversationId) return
    loadMessages(selectedConversationId)

    const channel = supabase
      .channel(`messages-${selectedConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message & { sender: Profile | null }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    if (!currentUser) return

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUser.id)

    if (!participations?.length) { setConversations([]); return }

    const conversationIds = participations.map(p => p.conversation_id)

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!convs) return

    const enriched = await Promise.all(convs.map(async (conv) => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(*)')
        .eq('conversation_id', conv.id)
        .neq('user_id', currentUser.id)
        .limit(1)

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...conv,
        other_participant: (participants?.[0] as any)?.profiles ?? null,
        last_message: lastMsg ?? null,
      } as ConversationWithDetails
    }))

    setConversations(enriched)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, username, full_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages((data ?? []) as any)
  }

  async function sendMessage() {
    if (!currentUser || !selectedConversationId || !newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      sender_id: currentUser.id,
      content,
    })
    if (!error) {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversationId)
      loadConversations()
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-neutral-500">Sign in to view messages.</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] border border-borderGlass rounded-2xl overflow-hidden">
      {/* Conversation List */}
      <div className="w-72 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setInboxTab('chats')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${inboxTab === 'chats' ? 'bg-white dark:bg-neutral-700 text-text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chats
            </button>
            <button
              onClick={() => setInboxTab('communities')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${inboxTab === 'communities' ? 'bg-white dark:bg-neutral-700 text-text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <Send className="w-3.5 h-3.5" />
              Communities
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxTab === 'communities' && (
            <div className="p-6 text-center flex flex-col items-center gap-3 mt-8">
              <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs text-neutral-400 font-medium">Communities coming soon</p>
              <p className="text-[10px] text-neutral-500">Group spaces for studios and collectives will appear here.</p>
            </div>
          )}
          {inboxTab === 'chats' && conversations.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-xs text-neutral-400">No conversations yet.</p>
              <p className="text-[10px] text-neutral-500 mt-1">Visit a profile and click Contact to start one.</p>
            </div>
          )}
          {inboxTab === 'chats' && conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={`w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition ${selectedConversationId === conv.id ? 'bg-neutral-100 dark:bg-neutral-900' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-bold uppercase flex-shrink-0">
                  {(conv.other_participant?.full_name || conv.other_participant?.username || '?').substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.other_participant?.full_name ?? conv.other_participant?.username ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {conv.last_message?.content ?? 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender_id === currentUser.id
                      ? 'bg-accent text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage() }}
              className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2"
            >
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-3" />
            <p className="text-sm text-neutral-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
