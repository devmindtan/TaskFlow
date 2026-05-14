import { createClient } from '@supabase/supabase-js'

// 👉 Replace these with your Supabase project values
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'YOUR_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },     // no auth in this app
  global: {
    // Use AsyncStorage so fetch works on RN
    fetch: fetch.bind(globalThis),
  },
})

export type TaskRow = {
  id: string
  device_id: string
  title: string
  description: string | null
  priority: 'low' | 'med' | 'high'
  due_date: string | null
  assignee: string | null
  done: boolean
  deleted: boolean
  created_at: string
  updated_at: string
}
