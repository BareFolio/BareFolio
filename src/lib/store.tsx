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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

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
        .single()

      if (error) {
        console.error('Error fetching profile:', error.message)
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
    <AppContext.Provider value={{ currentUser, profile, loading, refreshProfile }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) throw new Error('useApp must be used within an AppProvider')
  return context
}
