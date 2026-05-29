import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

export default function CampAdmin() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, user, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [campLoading, setCampLoading] = useState(true)

  // Fetch the camp once we know the user is logged in. RLS handles security
  // automatically: if the user doesn't own this camp, the query returns no
  // rows — there's no way to leak someone else's data.
  useEffect(() => {
    if (!session) return
    setCampLoading(true)
    supabase
      .from('camps')
      .select('id, slug, name, created_at')
      .eq('slug', campSlug)
      .maybeSingle()
      .then(({ data }) => {
        setCamp(data)
        setCampLoading(false)
      })
  }, [campSlug, session])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  // While we're checking who's logged in, show nothing (avoids a flash).
  if (authLoading) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>
  }

  // Not logged in? Send to login, remembering where they were trying to go.
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (campLoading) {
    return <div className="p-12 text-center text-gray-400">Loading camp…</div>
  }

  // No row came back — either the camp doesn't exist, or RLS hid it because
  // this user isn't the owner. Either way, they don't get to see it.
  if (!camp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Camp not found</h1>
        <p className="mt-2 text-gray-600">
          You're signed in as <span className="font-mono">{user.email}</span>, but you
          don't own a camp with the URL <span className="font-mono">{campSlug}</span>.
        </p>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">
          Go home
        </Link>
      </div>
    )
  }

  // Got the camp. Show the real dashboard.
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to={`/${camp.slug}`} className="text-sm text-emerald-700 hover:underline">
            View camp page &rarr;
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{camp.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your camp lives at{' '}
          <span className="font-mono">{window.location.host}/{camp.slug}</span>
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {['Campers', 'Counselors', 'Payments'].map((card) => (
            <div
              key={card}
              className="rounded-xl border border-gray-200 bg-white p-6 text-center"
            >
              <div className="text-sm font-medium text-gray-500">{card}</div>
              <div className="mt-1 text-3xl font-bold text-gray-300">—</div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-400">
          Real data lands here in Phase 3 (camper registration + payments).
        </p>
      </main>
    </div>
  )
}
