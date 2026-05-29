// Single shared Supabase client. Import this anywhere the app needs to
// read or write the database — never call createClient() elsewhere.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in the values.',
  )
}

export const supabase = createClient(url, key)
