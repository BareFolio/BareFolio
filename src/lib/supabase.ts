import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase features will not work.')
}

// Auto-format if only the project reference ID is provided (e.g. mzyhiyleoktpeamwjjse)
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl.trim()}.supabase.co`
}

// Fall back to a placeholder so the client can be instantiated without crashing the module.
// Queries will fail gracefully (network error) when env vars are not set.
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co'
const resolvedKey = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(resolvedUrl, resolvedKey)

