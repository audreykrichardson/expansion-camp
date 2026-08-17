import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getUpcomingSessions } from '../lib/sessions.js'

// Public-facing home page for a camp. No login required — this is what
// parents see when they visit roosevelt.expansioncamp.com (or /roosevelt).
export default function CampHome() {
  const { campSlug } = useParams()
  const [camp, setCamp] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data: campRow } = await supabase
        .from('camps')
        .select('id, slug, name, tagline, primary_color, logo_url, created_at')
        .eq('slug', campSlug)
        .maybeSingle()
      if (cancelled) return
      setCamp(campRow)

      // Pull the camp's schedule to show parents what's coming up. Reading
      // sessions here relies on a public SELECT policy on the sessions table
      // (added for this feature) — otherwise anon visitors get nothing back.
      if (campRow) {
        const { data: sessionRows } = await supabase
          .from('sessions')
          .select('id, title, description, session_date, start_time, end_time, is_public')
          .eq('camp_id', campRow.id)
        if (cancelled) return
        setSessions(sessionRows ?? [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [campSlug])

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>
  }

  if (!camp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Camp not found</h1>
        <p className="mt-2 text-gray-600">
          We couldn't find a camp at <span className="font-mono">/{campSlug}</span>.
        </p>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">
          Go home
        </Link>
      </div>
    )
  }

  const color = camp.primary_color || '#059669'
  const upcoming = getUpcomingSessions(sessions, todayISODate())

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        {camp.logo_url && (
          <img
            src={camp.logo_url}
            alt={`${camp.name} logo`}
            className="mx-auto mb-6 max-h-32 w-auto max-w-xs object-contain"
          />
        )}
        <p className="text-sm uppercase tracking-wide" style={{ color }}>
          Summer camp
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
          {camp.name}
        </h1>
        {camp.tagline && (
          <p className="mt-4 text-lg text-gray-600">{camp.tagline}</p>
        )}
        <Link
          to={`/${camp.slug}/register`}
          style={{ backgroundColor: color }}
          className="mt-8 inline-block rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Register your child
        </Link>

        {upcoming.length > 0 && (
          <section className="mt-16">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color }}>
              Schedule
            </h2>
            <div className="mx-auto mt-4 max-w-xl space-y-3 text-left">
              {upcoming.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="font-semibold text-gray-900">{s.title}</div>
                  <div className="mt-0.5 text-sm text-gray-500">
                    {formatDate(s.session_date)}
                    {s.start_time && ` · ${formatTime(s.start_time)}`}
                    {s.end_time && ` – ${formatTime(s.end_time)}`}
                  </div>
                  {s.description && (
                    <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                      {s.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Today's date as a local 'YYYY-MM-DD' string, matching how session_date is
// stored — so "upcoming" is judged in the visitor's own day, not UTC.
function todayISODate() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(t) {
  const [h, m] = t.split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m), 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
