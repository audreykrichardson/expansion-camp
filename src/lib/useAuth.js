// Hook for tracking the logged-in user across the app.
//
// Returns:
//   { session, user, loading }
//
// `loading` is true while we're checking the initial session on page load.
// After that, `session` updates automatically whenever the user logs in
// or out (in this tab OR another tab — Supabase syncs across tabs).
import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check whether there's an existing session (e.g. from a previous visit).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Subscribe to future auth changes (login, logout, token refresh).
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading }
}
