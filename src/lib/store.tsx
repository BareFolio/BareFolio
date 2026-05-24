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

function mapProfile(data: Profile): UserProfile {
  return {
    uid: data.id,
    username: data.username,
    full_name: data.full_name,
    email: '', // not in profiles table, from auth.users
    profile_type: data.profile_type,
    bio: data.bio,
    location: data.location,
    avatar_url: data.avatar_url,
    website: data.website,
    disciplines: data.disciplines ?? [],
    verified: data.verified,
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
  createPickerOpen: boolean
  setCreatePickerOpen: (open: boolean) => void
  newPostOpen: boolean
  setNewPostOpen: (open: boolean) => void
  tasteBuilderOpen: boolean
  setTasteBuilderOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedTab, setFeedTab] = useState<'all' | 'forYou'>('all')
  const [inboxTab, setInboxTab] = useState<'messages' | 'communities'>('messages')
  const [createPickerOpen, setCreatePickerOpen] = useState(false)
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [tasteBuilderOpen, setTasteBuilderOpen] = useState(false)

  const refreshProfile = async () => {
    if (!currentUser) return
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
    if (data) setProfile(mapProfile(data as Profile))
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!data) {
        // Create a default profile row if one doesn't exist (e.g. signed up before trigger was active)
        const baseUsername = user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : 'user';
        const uniqueUsername = `${baseUsername}_${user.id.slice(0, 6)}`;
        
        const { data: newProfile, error: insertError } = await supabase
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

        if (newProfile) {
          setProfile(mapProfile(newProfile as Profile));
        } else {
          console.error('Error creating default profile row:', insertError?.message);
        }
      } else if (data) {
        setProfile(mapProfile(data as Profile))
      }


      setLoading(false)

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
    <AppContext.Provider value={{ currentUser, profile, loading, refreshProfile, feedTab, setFeedTab, inboxTab, setInboxTab, createPickerOpen, setCreatePickerOpen, newPostOpen, setNewPostOpen, tasteBuilderOpen, setTasteBuilderOpen }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error('useApp must be used within an AppProvider')
  return context
}
