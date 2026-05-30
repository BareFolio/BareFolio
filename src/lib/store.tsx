'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import type { Profile, ProfileType } from './database.types'

export interface UserProfile {
  uid: string
  username: string
  full_name: string | null
  email: string
  profile_type: ProfileType
  bio: string | null
  location: string | null
  avatar_url: string | null
  website: string | null
  disciplines: string[]
  verified: boolean
  created_at: string
}

function mapProfile(data: any): UserProfile {
  return {
    uid: data.id,
    username: data.username,
    full_name: data.full_name || data.name || null,
    email: data.email || '',
    profile_type: (data.profile_type || data.role || 'creator') as ProfileType,
    bio: data.bio || null,
    location: data.location || null,
    avatar_url: data.avatar_url || null,
    website: data.website || null,
    disciplines: data.disciplines ?? [],
    verified: data.verified ?? data.is_verified ?? false,
    created_at: data.created_at,
  }
}

interface AppContextType {
  currentUser: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  feedTab: 'all' | 'forYou'
  setFeedTab: (tab: 'all' | 'forYou') => void
  inboxTab: 'messages' | 'communities'
  setInboxTab: (tab: 'messages' | 'communities') => void
  postsTab: 'everyone' | 'following'
  setPostsTab: (tab: 'everyone' | 'following') => void
  createPickerOpen: boolean
  setCreatePickerOpen: (open: boolean) => void
  newPostOpen: boolean
  setNewPostOpen: (open: boolean) => void
  tasteBuilderOpen: boolean
  setTasteBuilderOpen: (open: boolean) => void
  filterDrawerOpen: boolean
  setFilterDrawerOpen: (open: boolean) => void
  globalDiscipline: string | null
  setGlobalDiscipline: (d: string | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedTab, setFeedTab] = useState<'all' | 'forYou'>('all')
  const [inboxTab, setInboxTab] = useState<'messages' | 'communities'>('messages')
  const [postsTab, setPostsTab] = useState<'everyone' | 'following'>('everyone')
  const [createPickerOpen, setCreatePickerOpen] = useState(false)
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [tasteBuilderOpen, setTasteBuilderOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [globalDiscipline, setGlobalDiscipline] = useState<string | null>(null)

  const refreshProfile = async () => {
    if (!currentUser) return
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
    if (data) setProfile(mapProfile(data))
  }

  useEffect(() => {
    let profileSubscription: any = null

    const handleUserSession = async (user: User | null) => {
      setCurrentUser(user)

      if (profileSubscription) {
        supabase.removeChannel(profileSubscription)
        profileSubscription = null
      }

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      // Query profiles with maybeSingle to prevent crash if missing
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!data) {
        // Create a default profile row if one doesn't exist
        const baseUsername = user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : 'user';
        const uniqueUsername = `${baseUsername}_${user.id.slice(0, 6)}`;
        
        // Dynamically insert supporting both schemas
        let insertResult = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: uniqueUsername,
            full_name: user.user_metadata?.full_name || baseUsername,
            profile_type: 'creator'
          })
          .select('*')
          .maybeSingle();

        if (!insertResult.data) {
          insertResult = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: uniqueUsername,
              name: user.user_metadata?.full_name || baseUsername,
              email: user.email || '',
              role: 'creator'
            })
            .select('*')
            .maybeSingle();
        }

        if (insertResult.data) {
          setProfile(mapProfile(insertResult.data));
        } else {
          console.error('Error creating default profile row');
        }
      } else if (data) {
        setProfile(mapProfile(data))
      }

      setLoading(false)

      try {
        supabase.removeChannel(supabase.channel(`profile-${user.id}`));
      } catch (err) {
        console.error('Error removing channel:', err);
      }

      profileSubscription = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            if (payload.new) setProfile(mapProfile(payload.new as Profile))
          }
        )
        .subscribe()
    }

    // Initialize session state
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user ?? null)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
      if (profileSubscription) supabase.removeChannel(profileSubscription)
    }
  }, [])

  return (
    <AppContext.Provider value={{ currentUser, profile, loading, refreshProfile, feedTab, setFeedTab, inboxTab, setInboxTab, postsTab, setPostsTab, createPickerOpen, setCreatePickerOpen, newPostOpen, setNewPostOpen, tasteBuilderOpen, setTasteBuilderOpen, filterDrawerOpen, setFilterDrawerOpen, globalDiscipline, setGlobalDiscipline }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error('useApp must be used within an AppProvider')
  return context
}
