'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Inbox, 
  Briefcase, 
  Users, 
  Sparkles, 
  PlusCircle 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface ChatThread {
  id: string;
  members: string[];
  memberNames: string[];
  lastMessage: string;
  lastMessageAt: string;
}

interface BriefApplication {
  id: string;
  briefId: string;
  briefTitle?: string;
  creatorId: string;
  creatorName?: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
}

interface CommunityMessage {
  id: string;
  communityId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

const FALLBACK_THREADS: ChatThread[] = [
  {
    id: 'demo-chat-1',
    members: ['me', 'alex-mcqueen'],
    memberNames: ['My Profile', 'Alexander McQueen'],
    lastMessage: 'I absolutely love your editorial layouts in Issue 12. Shall we discuss the branding brief?',
    lastMessageAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'demo-chat-2',
    members: ['me', 'estudio-v'],
    memberNames: ['My Profile', 'Estudio V'],
    lastMessage: 'The $2,500 budget is confirmed for the packaging rebrand.',
    lastMessageAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

const FALLBACK_MESSAGES: Record<string, ChatMessage[]> = {
  'demo-chat-1': [
    { id: 'm1', senderId: 'alex-mcqueen', senderName: 'Alexander McQueen', text: 'Hi! I noticed you bookmarked my brutalist editorial design project. Thank you so much for the support!', createdAt: new Date(Date.now() - 1200000).toISOString() },
    { id: 'm2', senderId: 'me', senderName: 'My Profile', text: 'Of course Alexander, the typography choices are incredible. Are you available for remote design collaborations?', createdAt: new Date(Date.now() - 900000).toISOString() },
    { id: 'm3', senderId: 'alex-mcqueen', senderName: 'Alexander McQueen', text: 'I absolutely love your editorial layouts in Issue 12. Shall we discuss the branding brief?', createdAt: new Date(Date.now() - 600000).toISOString() }
  ],
  'demo-chat-2': [
    { id: 'm4', senderId: 'estudio-v', senderName: 'Estudio V', text: 'Hello, we received your application for our sustainable clay packaging brief.', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'm5', senderId: 'me', senderName: 'My Profile', text: 'Fantastic. I attached my design portfolio showing biodegradable cosmestic packaging examples.', createdAt: new Date(Date.now() - 5400000).toISOString() },
    { id: 'm6', senderId: 'estudio-v', senderName: 'Estudio V', text: 'The $2,500 budget is confirmed for the packaging rebrand.', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() }
  ]
};

const FALLBACK_APPLICATIONS: BriefApplication[] = [
  {
    id: 'app-demo-1',
    briefId: 'brief-1',
    briefTitle: 'Eco Boutique Hotel Rebrand',
    creatorId: 'alex-mcqueen',
    creatorName: 'Alexander McQueen',
    note: 'Submitting my application. I have 6+ years of visual branding experience in high-end hospitality.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'app-demo-2',
    briefId: 'brief-2',
    briefTitle: 'Sustainable Clay Cosmetics Packaging',
    creatorId: 'luisa-barriga',
    creatorName: 'Luisa Barriga',
    note: 'Eco-conscious materials are my design passion. You can inspect my Organic Clay study in my portfolio tab.',
    status: 'accepted',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const FALLBACK_COMMUNITIES: Community[] = [
  {
    id: 'comm-brutalist',
    name: 'Brutalist Typographers',
    description: 'Pushing typography bounds, physical layout weights and raw structural ink grids.',
    createdBy: 'alex-mcqueen',
    createdAt: new Date(Date.now() - 3600000 * 300).toISOString(),
    memberCount: 142
  },
  {
    id: 'comm-clay',
    name: 'Organic Clay Packaging',
    description: 'A study group for tactile minimalism, eco materials, and biodegradable bottles.',
    createdBy: 'estudio-v',
    createdAt: new Date(Date.now() - 3600000 * 100).toISOString(),
    memberCount: 88
  },
  {
    id: 'comm-capacitor',
    name: 'Capacitor Developers',
    description: 'Deploying high-fidelity web experiences directly to Apple iOS containers.',
    createdBy: 'hugo-ux',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    memberCount: 65
  }
];

const FALLBACK_COMMUNITY_MESSAGES: Record<string, CommunityMessage[]> = {
  'comm-brutalist': [
    { id: 'cm1', communityId: 'comm-brutalist', senderId: 'alex-mcqueen', senderName: 'Alexander McQueen', text: 'Welcome to Brutalist Typographers! Post your raw letterforms in the feed.', createdAt: new Date(Date.now() - 10000000).toISOString() },
    { id: 'cm2', communityId: 'comm-brutalist', senderId: 'hugo-ux', senderName: 'Hugo Bossio', text: 'Really liking the large slab serifs in Alexander’s poster.', createdAt: new Date(Date.now() - 5000000).toISOString() },
    { id: 'cm3', communityId: 'comm-brutalist', senderId: 'luisa-barriga', senderName: 'Luisa Barriga', text: 'Is anyone printing physical zines soon? Let’s organize a collaborative shoot.', createdAt: new Date(Date.now() - 1000000).toISOString() }
  ],
  'comm-clay': [
    { id: 'cm4', communityId: 'comm-clay', senderId: 'estudio-v', senderName: 'Estudio V', text: 'Hey packaging crew, what biodegradable raw plastics have you been testing lately?', createdAt: new Date(Date.now() - 20000000).toISOString() },
    { id: 'cm5', communityId: 'comm-clay', senderId: 'alex-mcqueen', senderName: 'Alexander McQueen', text: 'Bamboo-derived fiber pulp has exceptional tactile weight.', createdAt: new Date(Date.now() - 8000000).toISOString() }
  ],
  'comm-capacitor': [
    { id: 'cm6', communityId: 'comm-capacitor', senderId: 'hugo-ux', senderName: 'Hugo Bossio', text: 'Hey mobile devs! Remember to double check viewport insets for iOS devices.', createdAt: new Date(Date.now() - 5000000).toISOString() }
  ]
};

export default function InboxPage() {
  const { profile } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const queryChatId = searchParams.get('chat');
  const queryCommId = searchParams.get('id');
  const urlTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'dm_notifications' | 'communities'>('dm_notifications');
  const [dmSubTab, setDmSubTab] = useState<'dms' | 'scout'>('dms');
  
  // 1-on-1 DM States
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Communities States
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommId, setActiveCommId] = useState<string>('');
  const [commMessages, setCommMessages] = useState<CommunityMessage[]>([]);
  const [commInputText, setCommInputText] = useState('');

  // Brief Applications
  const [applications, setApplications] = useState<BriefApplication[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commMessagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active states from search parameters
  useEffect(() => {
    if (urlTab === 'communities') {
      setActiveTab('communities');
      if (queryCommId) {
        setActiveCommId(queryCommId);
      }
    } else if (queryChatId) {
      setActiveTab('dm_notifications');
      setDmSubTab('dms');
      setActiveThreadId(queryChatId);
    }
  }, [queryChatId, queryCommId, urlTab]);

  // Scroll active windows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    commMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commMessages]);

  // 1. Threads listener
  useEffect(() => {
    if (!profile) return;

    const fetchThreads = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .order('last_message_at', { ascending: false });

        if (error) {
          console.warn("DMs fetch failed, fallbacks loaded:", error.message);
        } else if (data && data.length > 0) {
          const list: ChatThread[] = data
            .filter((c: any) => c.members && c.members.includes(profile.uid))
            .map((c: any) => ({
              id: c.id,
              members: c.members,
              memberNames: c.member_names || [],
              lastMessage: c.last_message || '',
              lastMessageAt: c.last_message_at || new Date().toISOString()
            }));
          setThreads(list);
          
          if (list.length > 0 && !activeThreadId && !queryChatId) {
            setActiveThreadId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Chats threads load failed:", err);
      }
    };

    fetchThreads();

    let chatsChannel: any = null;
    try {
      chatsChannel = supabase
        .channel('chats-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
          fetchThreads();
        })
        .subscribe();
    } catch (realtimeErr) {
      console.error("Realtime chats failed:", realtimeErr);
    }

    return () => {
      if (chatsChannel) supabase.removeChannel(chatsChannel);
    };
  }, [profile, activeThreadId, queryChatId]);

  // 2. Active Messages listener
  useEffect(() => {
    if (!activeThreadId) return;
    
    if (activeThreadId.startsWith('demo-chat-') || activeThreadId === 'mock-thread') {
      setMessages(FALLBACK_MESSAGES[activeThreadId === 'mock-thread' ? 'demo-chat-1' : activeThreadId] || []);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', activeThreadId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn("Messages query error:", error.message);
        } else if (data) {
          setMessages(data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            text: m.text,
            createdAt: m.created_at,
          })));
        }
      } catch (err) {
        console.error("Messages query error:", err);
      }
    };

    fetchMessages();

    let msgsChannel: any = null;
    try {
      msgsChannel = supabase
        .channel(`messages-chat-${activeThreadId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeThreadId}` }, () => {
          fetchMessages();
        })
        .subscribe();
    } catch (realtimeErr) {
      console.error("Realtime messages failed:", realtimeErr);
    }

    return () => {
      if (msgsChannel) supabase.removeChannel(msgsChannel);
    };
  }, [activeThreadId]);

  // 3. Communities List Loader
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn("Communities select failed, loading fallbacks:", error.message);
        } else if (data && data.length > 0) {
          const list = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            avatarUrl: c.avatar_url || '',
            createdBy: c.created_by,
            createdAt: c.created_at,
            memberCount: Math.floor(Math.random() * 15) + 6
          }));
          setCommunities(list);

          if (list.length > 0 && !activeCommId && !queryCommId) {
            setActiveCommId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Communities fetching error:", err);
      }
    };

    fetchCommunities();

    let commsChannel: any = null;
    try {
      commsChannel = supabase
        .channel('communities-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => {
          fetchCommunities();
        })
        .subscribe();
    } catch (realtimeErr) {
      console.warn("Realtime communities failed:", realtimeErr);
    }

    return () => {
      if (commsChannel) supabase.removeChannel(commsChannel);
    };
  }, [activeCommId, queryCommId]);

  // 4. Community Messages Loader
  useEffect(() => {
    if (!activeCommId) return;

    if (activeCommId.startsWith('comm-')) {
      setCommMessages(FALLBACK_COMMUNITY_MESSAGES[activeCommId] || []);
      return;
    }

    const fetchCommMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('community_messages')
          .select('*')
          .eq('community_id', activeCommId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn("Community messages query error:", error.message);
        } else if (data) {
          setCommMessages(data.map((m: any) => ({
            id: m.id,
            communityId: m.community_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            text: m.text,
            createdAt: m.created_at
          })));
        }
      } catch (err) {
        console.error("Community messages query error:", err);
      }
    };

    fetchCommMessages();

    let commMsgsChannel: any = null;
    try {
      commMsgsChannel = supabase
        .channel(`comm-messages-${activeCommId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages', filter: `community_id=eq.${activeCommId}` }, () => {
          fetchCommMessages();
        })
        .subscribe();
    } catch (realtimeErr) {
      console.warn("Realtime community messages failed:", realtimeErr);
    }

    return () => {
      if (commMsgsChannel) supabase.removeChannel(commMsgsChannel);
    };
  }, [activeCommId]);

  // 5. Brief Applications listener
  useEffect(() => {
    if (!profile) return;

    const fetchApplications = async () => {
      try {
        let query = supabase.from('applications').select('*').order('created_at', { ascending: false });
        if (profile.profile_type !== 'brand' && profile.profile_type !== 'studio') {
          query = query.eq('creator_id', profile.uid);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          setApplications(data.map((app: any) => ({
            id: app.id,
            briefId: app.brief_id,
            briefTitle: app.brief_title,
            creatorId: app.creator_id,
            creatorName: app.creator_name,
            note: app.note,
            status: app.status as any,
            createdAt: app.created_at,
          })));
        }
      } catch (err) {
        console.error("Applications loading error:", err);
      }
    };

    fetchApplications();

    let appsChannel: any = null;
    try {
      appsChannel = supabase.channel('applications-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => { fetchApplications(); }).subscribe();
    } catch (realtimeErr) {
      console.warn("Realtime apps failed:", realtimeErr);
    }

    return () => {
      if (appsChannel) supabase.removeChannel(appsChannel);
    };
  }, [profile]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile || !activeThreadId) return;

    const msgText = inputText;
    setInputText('');

    if (activeThreadId.startsWith('demo-chat-') || activeThreadId === 'mock-thread') {
      const activeId = activeThreadId === 'mock-thread' ? 'demo-chat-1' : activeThreadId;
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, senderId: profile.uid, senderName: profile.full_name ?? profile.username, text: msgText, createdAt: new Date().toISOString() }
      ]);
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: `local-reply-${Date.now()}`, senderId: activeId === 'demo-chat-1' ? 'alex-mcqueen' : 'estudio-v', senderName: activeId === 'demo-chat-1' ? 'Alexander McQueen' : 'Estudio V', text: 'Perfect! I will review the visual requirements and get back to you shortly.', createdAt: new Date().toISOString() }
        ]);
      }, 1500);
      return;
    }

    try {
      await supabase.from('messages').insert({
        chat_id: activeThreadId,
        sender_id: profile.uid,
        sender_name: profile.full_name ?? profile.username,
        text: msgText
      });

      await supabase.from('chats').update({
        last_message: msgText,
        last_message_at: new Date().toISOString()
      }).eq('id', activeThreadId);
    } catch (err) {
      console.error("Failed to append message:", err);
    }
  };

  const handleSendCommMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commInputText.trim() || !profile || !activeCommId) return;

    const msgText = commInputText;
    setCommInputText('');

    if (activeCommId.startsWith('comm-')) {
      setCommMessages((prev) => [
        ...prev,
        { id: `local-comm-${Date.now()}`, communityId: activeCommId, senderId: profile.uid, senderName: profile.full_name ?? profile.username, text: msgText, createdAt: new Date().toISOString() }
      ]);
      
      // Sim response from group channel members
      setTimeout(() => {
        const commCreator = activeCommId === 'comm-brutalist' ? 'Alexander McQueen' : 'Estudio V';
        setCommMessages((prev) => [
          ...prev,
          { id: `local-comm-reply-${Date.now()}`, communityId: activeCommId, senderId: 'member-reply', senderName: commCreator, text: 'Awesome input! High-fidelity visual aesthetics are what we are all about.', createdAt: new Date().toISOString() }
        ]);
      }, 1800);
      return;
    }

    try {
      await supabase.from('community_messages').insert({
        community_id: activeCommId,
        sender_id: profile.uid,
        sender_name: profile.full_name ?? profile.username,
        text: msgText
      });
    } catch (err) {
      console.error("Failed to insert community message:", err);
    }
  };

  const updateApplicationStatus = async (id: string, newStatus: 'accepted' | 'rejected') => {
    try {
      await supabase.from('applications').update({ status: newStatus }).eq('id', id);
      setApplications((prev) => 
        prev.map((app) => app.id === id ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      console.error("Failed to update application:", err);
    }
  };

  // Merge datasets
  const activeThreads = threads.length > 0 ? [...threads, ...FALLBACK_THREADS] : FALLBACK_THREADS;
  const activeApps = applications.length > 0 ? [...applications, ...FALLBACK_APPLICATIONS] : FALLBACK_APPLICATIONS;
  const allComms = communities.length > 0 ? [...communities, ...FALLBACK_COMMUNITIES.filter(fc => !communities.some(dc => dc.name === fc.name))] : FALLBACK_COMMUNITIES;

  const currentSelectedThread = activeThreads.find((t) => t.id === activeThreadId);
  const otherMemberName = currentSelectedThread
    ? currentSelectedThread.memberNames.find((name) => name !== (profile?.full_name ?? profile?.username)) || 'Conversation'
    : 'Messages';

  const currentSelectedComm = allComms.find((c) => c.id === activeCommId);
  const currentCommName = currentSelectedComm ? currentSelectedComm.name : 'Group Channel';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-borderGlass pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-7 h-7 text-accent" />
            <span>Inbox Channels</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your real-time 1-on-1 conversations, scout briefs, and group creative communities.
          </p>
        </div>

        {/* Global Inbox Tabs */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-2xl gap-1.5 border border-borderGlass">
          <button 
            onClick={() => setActiveTab('dm_notifications')}
            className={`px-4.5 py-2.5 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${activeTab === 'dm_notifications' ? 'bg-accent text-white shadow-md' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>DMs & Notifications</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('communities');
              if (allComms.length > 0 && !activeCommId) {
                setActiveCommId(allComms[0].id);
              }
            }}
            className={`px-4.5 py-2.5 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${activeTab === 'communities' ? 'bg-accent text-white shadow-md' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Communities Chat</span>
          </button>
        </div>
      </div>

      {activeTab === 'dm_notifications' ? (
        <div className="space-y-4">
          
          {/* Sub-toggle inside DMs */}
          <div className="flex gap-2 border-b border-borderGlass/50 pb-2">
            <button
              onClick={() => setDmSubTab('dms')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${dmSubTab === 'dms' ? 'bg-accent/10 text-accent font-extrabold' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Direct Messages
            </button>
            <button
              onClick={() => setDmSubTab('scout')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${dmSubTab === 'scout' ? 'bg-accent/10 text-accent font-extrabold' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Scout Brief Applications ({activeApps.length})
            </button>
          </div>

          {dmSubTab === 'dms' ? (
            <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[460px]">
              
              {/* Sidebar list of 1-on-1 threads */}
              <div className="glass rounded-3xl border border-borderGlass flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-borderGlass">
                  <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-100">Private Threads</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-borderGlass/30">
                  {activeThreads.map((thread) => {
                    const threadMember = thread.memberNames.find((name) => name !== (profile?.full_name ?? profile?.username)) || 'Member';
                    const isSelected = thread.id === activeThreadId;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => setActiveThreadId(thread.id)}
                        className={`p-4 cursor-pointer transition flex items-center gap-3 ${
                          isSelected 
                            ? 'bg-accent/5 dark:bg-accent/10 border-l-4 border-accent' 
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {threadMember.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="text-xs font-display font-bold text-neutral-800 dark:text-neutral-100 truncate">
                              {threadMember}
                            </h4>
                            <span className="text-[9px] text-neutral-400">
                              {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-sans">
                            {thread.lastMessage}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat view */}
              <div className="glass rounded-3xl border border-borderGlass flex flex-col md:col-span-2 overflow-hidden h-full">
                {activeThreadId ? (
                  <>
                    <div className="px-6 py-4 border-b border-borderGlass flex items-center justify-between bg-white/30 dark:bg-black/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs uppercase">
                          {otherMemberName.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-display font-black text-neutral-800 dark:text-neutral-100 leading-tight">
                            {otherMemberName}
                          </h4>
                          <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            <span>Active now</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/10 dark:bg-black/10">
                      {messages.map((m) => {
                        const isMe = m.senderId === profile?.uid || m.senderId === 'me';
                        return (
                          <div 
                            key={m.id}
                            className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                            <div 
                              className={`rounded-2xl px-4 py-2.5 text-xs ${
                                isMe 
                                  ? 'bg-accent text-white shadow-md rounded-br-none' 
                                  : 'glass border border-borderGlass rounded-bl-none text-neutral-800 dark:text-neutral-100'
                              }`}
                            >
                              <p className="leading-relaxed font-sans">{m.text}</p>
                            </div>
                            <span className="text-[9px] text-neutral-400 mt-1 font-medium px-1">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <form 
                      onSubmit={handleSendMessage}
                      className="p-4 border-t border-borderGlass bg-white/30 dark:bg-black/30 flex gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Message ${otherMemberName}...`}
                        className="flex-1 bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass px-4 py-3 rounded-xl focus:outline-none focus:border-accent text-xs"
                      />
                      <button
                        type="submit"
                        className="w-11 h-11 bg-accent hover:bg-accent-hover text-white rounded-xl flex items-center justify-center shadow transition duration-200 cursor-pointer active:scale-95 flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <Inbox className="w-12 h-12 text-neutral-300" />
                    <div>
                      <h4 className="font-display font-bold text-neutral-700 dark:text-neutral-300">No Thread Selected</h4>
                      <p className="text-xs text-neutral-400 mt-1">Select an active conversation on the left, or contact a designer from the explore hub.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            
            /* Sub-tab: Applications */
            <div className="space-y-4 max-w-3xl mx-auto min-h-[300px]">
              {activeApps.length === 0 ? (
                <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass flex flex-col items-center gap-2">
                  <Briefcase className="w-10 h-10 text-neutral-300" />
                  <span>No brief applications filed on this account.</span>
                </div>
              ) : (
                activeApps.map((app) => {
                  const isScout = profile?.profile_type === 'brand' || profile?.profile_type === 'studio';
                  const title = app.briefTitle || 'Visual Design Brief Application';
                  const applicantName = app.creatorName || 'Creative Member';

                  return (
                    <div key={app.id} className="glass p-6 rounded-2xl border border-borderGlass shadow-sm hover:shadow-md transition space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] bg-accent/10 text-accent font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-accent/10">
                            {title}
                          </span>
                          <h4 className="font-display font-black text-sm text-neutral-800 dark:text-neutral-100 pt-1">
                            Applicant: {applicantName}
                          </h4>
                          <p className="text-[10px] text-neutral-400">
                            Submitted on {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {app.status === 'accepted' && (
                            <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Accepted</span>
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Declined</span>
                            </span>
                          )}
                          {app.status === 'pending' && (
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-4 rounded-xl border border-borderGlass/50">
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                          "{app.note}"
                        </p>
                      </div>

                      {isScout && app.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'rejected')} 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition border border-red-500/10 active:scale-95"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'accepted')} 
                            className="bg-green-500 text-white hover:bg-green-600 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow transition active:scale-95"
                          >
                            Accept Candidate
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      ) : (
        
        /* COMMUNITIES SECTION TAB */
        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[480px]">
          
          {/* Left panel: Communities List */}
          <div className="glass rounded-3xl border border-borderGlass flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-borderGlass flex justify-between items-center bg-white/10 dark:bg-black/10">
              <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-100">Communities</h3>
              <button 
                onClick={() => router.push('/explore?category=communities')}
                className="text-neutral-400 hover:text-accent p-1"
                title="Discover Communities"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-borderGlass/30">
              {allComms.map((comm) => {
                const isSelected = comm.id === activeCommId;
                return (
                  <div
                    key={comm.id}
                    onClick={() => setActiveCommId(comm.id)}
                    className={`p-4 cursor-pointer transition flex items-start gap-3 ${
                      isSelected 
                        ? 'bg-accent/5 dark:bg-accent/10 border-l-4 border-accent' 
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent/20 to-[#8EC5FC]/30 text-accent flex items-center justify-center font-display font-black text-xs uppercase flex-shrink-0 mt-0.5 border border-accent/15">
                      {comm.name.substring(0, 2)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-display font-bold text-neutral-800 dark:text-neutral-100 truncate">
                          {comm.name}
                        </h4>
                        <span className="text-[8px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold uppercase">
                          {comm.memberCount || 10}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 leading-tight font-sans">
                        {comm.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active Group Chat Room */}
          <div className="glass rounded-3xl border border-borderGlass flex flex-col md:col-span-2 overflow-hidden h-full">
            {activeCommId ? (
              <>
                {/* Community Chat Header */}
                <div className="px-6 py-4 border-b border-borderGlass flex items-center justify-between bg-white/30 dark:bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-display font-black text-xs uppercase shadow-inner">
                      {currentCommName.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-black text-neutral-800 dark:text-neutral-100 leading-tight">
                        {currentCommName}
                      </h4>
                      <p className="text-[9px] text-neutral-400 font-sans mt-0.5 max-w-sm truncate leading-none">
                        {currentSelectedComm?.description}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-[10px] bg-accent/10 text-accent font-extrabold px-3 py-1 rounded-full border border-accent/10 uppercase tracking-wider">
                    Community Channel
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/10 dark:bg-black/10">
                  {commMessages.map((m) => {
                    const isMe = m.senderId === profile?.uid || m.senderId === 'me';
                    return (
                      <div 
                        key={m.id}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        {/* Member Sender Tag */}
                        {!isMe && (
                          <span className="text-[9px] text-neutral-400 font-bold mb-1 px-1">
                            {m.senderName}
                          </span>
                        )}
                        
                        <div 
                          className={`rounded-2xl px-4 py-2.5 text-xs ${
                            isMe 
                              ? 'bg-accent text-white shadow-md rounded-br-none' 
                              : 'glass border border-borderGlass rounded-bl-none text-neutral-800 dark:text-neutral-100'
                          }`}
                        >
                          <p className="leading-relaxed font-sans">{m.text}</p>
                        </div>
                        <span className="text-[8px] text-neutral-400 mt-1 font-medium px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={commMessagesEndRef} />
                </div>

                {/* Compositor Group Input */}
                <form 
                  onSubmit={handleSendCommMessage}
                  className="p-4 border-t border-borderGlass bg-white/30 dark:bg-black/30 flex gap-2 items-center"
                >
                  <input
                    type="text"
                    value={commInputText}
                    onChange={(e) => setCommInputText(e.target.value)}
                    placeholder={`Post to #${currentCommName.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass px-4 py-3 rounded-xl focus:outline-none focus:border-accent text-xs"
                  />
                  <button
                    type="submit"
                    className="w-11 h-11 bg-accent hover:bg-accent-hover text-white rounded-xl flex items-center justify-center shadow transition duration-200 cursor-pointer active:scale-95 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <Users className="w-12 h-12 text-neutral-300 animate-pulse" />
                <div>
                  <h4 className="font-display font-bold text-neutral-700 dark:text-neutral-300">Join a Community</h4>
                  <p className="text-xs text-neutral-400 mt-1">Select a community group on the left panel to join the conversation.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
