export type ProfileType = 'creator' | 'seeker' | 'studio' | 'brand' | 'organization'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type ContentType = 'project' | 'post' | 'brief'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  profile_type: ProfileType
  location: string | null
  website: string | null
  disciplines: string[]
  verified: boolean
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  images: string[]
  discipline: string | null
  year: number | null
  client: string | null
  visual_language: string | null
  palette: string[]
  atmosphere: string | null
  ai_tags: Record<string, unknown>
  tags: string[]
  verification_status: VerificationStatus
  created_at: string
  profile?: Profile
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  location: string | null
  created_at: string
  profile?: Profile
}

export interface Brief {
  id: string
  user_id: string
  title: string
  description: string | null
  disciplines: string[]
  budget: string | null
  deadline: string | null
  duration: string | null
  tags: string[]
  created_at: string
  profile?: Profile
}

export interface Like {
  id: string
  user_id: string
  target_type: ContentType
  target_id: string
  created_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  is_public: boolean
  created_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  target_type: ContentType
  target_id: string
  created_at: string
}

// Composite PK (follower_id + following_id) — no id field; incompatible with generic { id: string } utilities
export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Conversation {
  id: string
  last_message_at: string | null
  created_at: string
  participants?: Profile[]
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

// type discriminant is NOT a DB column — callers must add { type: 'project'|'post'|'brief' } when building from raw rows
export type FeedItem =
  | ({ type: 'project' } & Project)
  | ({ type: 'post' } & Post)
  | ({ type: 'brief' } & Brief)
