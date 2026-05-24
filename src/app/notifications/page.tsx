'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

const NOTIFICATIONS_NEW = [
  { 
    id: 'n1', 
    actor: 'Clara Fortea', 
    action: 'is interested to work with you', 
    time: '2 min', 
    hasView: true, 
    highlight: true, 
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    initials: 'CF' 
  },
  { 
    id: 'n2', 
    actor: 'North Studio', 
    action: 'wants to work with you', 
    time: '2 min', 
    hasView: true, 
    highlight: false, 
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    initials: 'NS' 
  },
  { 
    id: 'n3', 
    actor: 'Aidi Beltran', 
    action: 'started following you', 
    time: '2 min', 
    hasView: false, 
    highlight: false, 
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    initials: 'AB' 
  },
];

const NOTIFICATIONS_ALL = [
  { 
    id: 'n4', 
    actor: 'Artcore', 
    action: 'commented on your project', 
    sub: 'Editorial System Vol.2', 
    time: '2 min', 
    avatarUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&q=80',
    initials: 'AC' 
  },
  { 
    id: 'n5', 
    actor: 'Valen Posternak', 
    action: 'mentioned you in a comment', 
    sub: 'Editorial System Vol.2', 
    time: '2 min', 
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
    initials: 'VP' 
  },
  { 
    id: 'n6', 
    actor: 'Pau Suris', 
    action: 'saved your project', 
    sub: 'Editorial System Vol.2', 
    time: '2 min', 
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    initials: 'PS' 
  },
];

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-xl mx-auto md:py-4 select-none pb-28">
      <div className="bg-[#FAFAFA] md:bg-white md:border md:border-neutral-200 md:rounded-2xl md:shadow-sm overflow-hidden min-h-[calc(100vh-160px)] md:min-h-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-200/20 md:border-neutral-100 bg-[#FAFAFA] md:bg-white">
          <h2 className="text-xl font-black text-[#101010] tracking-tight">Notifications</h2>
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-neutral-150 transition-colors cursor-pointer text-neutral-400 hover:text-text-primary"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-4 space-y-6">

          {/* New Group */}
          <div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest px-1 mb-3">New</p>
            <div className="space-y-2.5">
              {NOTIFICATIONS_NEW.map(n => (
                <div
                  key={n.id}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                    n.highlight 
                      ? 'bg-[#5B5BD6]/10 border-[#5B5BD6]/10 text-[#5B5BD6]' 
                      : 'bg-white border-neutral-200/30 text-text-primary shadow-sm shadow-black/[0.005]'
                  }`}
                >
                  {n.avatarUrl ? (
                    <img
                      src={n.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase flex-shrink-0">
                      {n.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-extrabold">{n.actor}</span> {n.action}
                    </p>
                    <p className={`text-xs mt-0.5 ${n.highlight ? 'text-[#5B5BD6]/75' : 'text-neutral-400'}`}>{n.time}</p>
                  </div>
                  {n.hasView && (
                    <button className="bg-[#101010] text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer hover:bg-neutral-850 transition-colors flex-shrink-0 shadow-sm active:scale-95">
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* All Notifications Group */}
          <div>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest px-1 mb-3">All Notifications</p>
            <div className="space-y-2.5">
              {NOTIFICATIONS_ALL.map(n => (
                <div key={n.id} className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-neutral-200/30 text-text-primary shadow-sm shadow-black/[0.005]">
                  {n.avatarUrl ? (
                    <img
                      src={n.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500 uppercase flex-shrink-0">
                      {n.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-extrabold">{n.actor}</span> {n.action}
                    </p>
                    {n.sub && (
                      <p className="text-xs text-neutral-400 mt-0.5 font-medium">↳ {n.sub}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
