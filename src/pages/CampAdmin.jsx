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
  const [camperCount, setCamperCount] = useState(null)
  const [counselorCount, setCounselorCount] = useState(null)
  const [sessionCount, setSessionCount] = useState(null)
  const [campLoading, setCampLoading] = useState(true)

  // Fetch the camp + a count of registered campers. RLS keeps everything
  // safe: another user querying the same slug just won't see their campers.
  useEffect(() => {
    if (!session) return
    let cancelled = false
    setCampLoading(true)
    ;(async () => {
      const { data: campRow } = await supabase
        .from('camps')
        .select('id, slug, name, tagline, logo_url, primary_color, created_at')
        .eq('slug', campSlug)
        .maybeSingle()

      if (cancelled) return
      setCamp(campRow)

      if (campRow) {
        const [
          { count: camperC },
          { count: counselorC },
          { count: sessionC },
        ] = await Promise.all([
          supabase
            .from('campers')
            .select('*', { count: 'exact', head: true })
            .eq('camp_id', campRow.id),
          supabase
            .from('counselors')
            .select('*', { count: 'exact', head: true })
            .eq('camp_id', campRow.id),
          supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('camp_id', campRow.id),
        ])
        if (!cancelled) {
          setCamperCount(camperC ?? 0)
          setCounselorCount(counselorC ?? 0)
          setSessionCount(sessionC ?? 0)
        }
      }
      if (!cancelled) setCampLoading(false)
    })()

    return () => {
      cancelled = true
    }
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
            <Link
              to={`/${camp.slug}/admin/settings`}
              className="text-sm font-medium text-gray-700 hover:text-emerald-700"
            >
              Settings
            </Link>
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

        <GettingStarted
          camp={camp}
          camperCount={camperCount}
          counselorCount={counselorCount}
          sessionCount={sessionCount}
        />

        <div className="mt-10 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            to={`/${camp.slug}/admin/campers`}
            className="rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:border-emerald-400 hover:shadow-sm"
          >
            <div className="text-sm font-medium text-gray-500">Campers</div>
            <div className="mt-1 text-3xl font-bold text-emerald-600">
              {camperCount ?? '—'}
            </div>
            <div className="mt-1 text-xs text-gray-400">View roster &rarr;</div>
          </Link>

          <Link
            to={`/${camp.slug}/admin/counselors`}
            className="rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:border-emerald-400 hover:shadow-sm"
          >
            <div className="text-sm font-medium text-gray-500">Counselors</div>
            <div className="mt-1 text-3xl font-bold text-emerald-600">
              {counselorCount ?? '—'}
            </div>
            <div className="mt-1 text-xs text-gray-400">Manage staff &rarr;</div>
          </Link>

          <Link
            to={`/${camp.slug}/admin/sessions`}
            className="rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:border-emerald-400 hover:shadow-sm"
          >
            <div className="text-sm font-medium text-gray-500">Sessions</div>
            <div className="mt-1 text-3xl font-bold text-emerald-600">
              {sessionCount ?? '—'}
            </div>
            <div className="mt-1 text-xs text-gray-400">Schedule &rarr;</div>
          </Link>

          <Link
            to={`/${camp.slug}/admin/attendance`}
            className="rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:border-emerald-400 hover:shadow-sm"
          >
            <div className="text-sm font-medium text-gray-500">Attendance</div>
            <div className="mt-1 text-3xl font-bold text-emerald-600">·</div>
            <div className="mt-1 text-xs text-gray-400">View report &rarr;</div>
          </Link>

          {/* Payments — Phase 3B placeholder. */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="text-sm font-medium text-gray-500">Payments</div>
            <div className="mt-1 text-3xl font-bold text-gray-300">—</div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <span className="font-semibold">Share your registration link:</span>{' '}
          <span className="font-mono">
            {window.location.host}/{camp.slug}/register
          </span>
        </div>
      </main>
    </div>
  )
}

// Onboarding checklist. Shown when there are still first-time tasks to do,
// hides itself once every item is done so it doesn't clutter a mature camp.
function GettingStarted({ camp, camperCount, counselorCount, sessionCount }) {
  const items = [
    {
      done: camp.tagline || camp.logo_url || (camp.primary_color && camp.primary_color !== '#059669'),
      text: 'Customize your camp — pick a color, add a tagline or logo',
      href: `/${camp.slug}/admin/settings`,
      cta: 'Open settings',
    },
    {
      done: (counselorCount ?? 0) > 0,
      text: 'Invite your first counselor',
      href: `/${camp.slug}/admin/counselors`,
      cta: 'Invite',
    },
    {
      done: (sessionCount ?? 0) > 0,
      text: 'Add your first session (activity block)',
      href: `/${camp.slug}/admin/sessions`,
      cta: 'Add session',
    },
    {
      done: (camperCount ?? 0) > 0,
      text: 'Share your registration link with parents',
      href: `/${camp.slug}/register`,
      cta: 'Preview form',
    },
  ]

  const doneCount = items.filter((i) => i.done).length
  const total = items.length

  // Hide once everything's done.
  if (doneCount === total) return null

  return (
    <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Get your camp set up</h2>
          <p className="mt-1 text-sm text-gray-500">
            {doneCount} of {total} done — knock these out to launch.
          </p>
        </div>
        <div className="text-sm font-semibold text-emerald-700">
          {Math.round((doneCount / total) * 100)}%
        </div>
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={
                  item.done
                    ? 'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500 text-xs text-white'
                    : 'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-gray-300'
                }
              >
                {item.done && '✓'}
              </span>
              <span className={item.done ? 'text-sm text-gray-400 line-through' : 'text-sm text-gray-700'}>
                {item.text}
              </span>
            </div>
            {!item.done && (
              <Link
                to={item.href}
                className="whitespace-nowrap text-xs font-medium text-emerald-700 hover:underline"
              >
                {item.cta} &rarr;
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
