'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const NOTIFICATIONS_NEW = [
  { id: 'n1', actor: 'Clara Fortea', action: 'is interested to work with you', time: '2 min', hasView: true, highlight: true, initials: 'CF' },
  { id: 'n2', actor: 'North Studio', action: 'wants to work with you', time: '2 min', hasView: true, highlight: false, initials: 'NS' },
  { id: 'n3', actor: 'Aidi Beltran', action: 'started following you', time: '2 min', hasView: false, highlight: false, initials: 'AB' },
]

const NOTIFICATIONS_ALL = [
  { id: 'n4', actor: 'Artcore', action: 'commented on your project', sub: 'Editorial System Vol.2', time: '2 min', initials: 'AC' },
  { id: 'n5', actor: 'Valen Posternak', action: 'mentioned you in a comment', sub: 'Editorial System Vol.2', time: '2 min', initials: 'VP' },
  { id: 'n6', actor: 'Pau Suris', action: 'saved your project', sub: 'Editorial System Vol.2', time: '2 min', initials: 'PS' },
]

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div className="max-w-xl mx-auto py-4">
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-text-primary">Notifications</h2>
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-400 hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* New */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-3">New</p>
            <div className="space-y-2">
              {NOTIFICATIONS_NEW.map(n => (
                <div
                  key={n.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl ${n.highlight ? 'bg-[#5B5BD6]/10' : 'bg-neutral-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase flex-shrink-0">
                    {n.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary leading-snug">
                      <span className="font-bold">{n.actor}</span> {n.action}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">{n.time}</p>
                  </div>
                  {n.hasView && (
                    <button className="bg-[#101010] text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer hover:bg-neutral-800 transition-colors flex-shrink-0">
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* All Notifications */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-3">All Notifications</p>
            <div className="space-y-1">
              {NOTIFICATIONS_ALL.map(n => (
                <div key={n.id} className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500 uppercase flex-shrink-0">
                    {n.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary leading-snug">
                      <span className="font-bold">{n.actor}</span> {n.action}
                    </p>
                    {n.sub && (
                      <p className="text-xs text-neutral-400 mt-0.5">↳ {n.sub}</p>
                    )}
                    <p className="text-xs text-neutral-400">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
