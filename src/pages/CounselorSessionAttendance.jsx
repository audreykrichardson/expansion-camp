import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// Attendance page for a single session. Shows the counselor's assigned
// campers with Present/Absent/Late buttons per row. RLS keeps things safe:
// only the assigned counselor (or the camp owner) can mark attendance for
// a given session.
export default function CounselorSessionAttendance() {
  const { campSlug, sessionId } = useParams()
  const location = useLocation()
  const { session: authSession, loading: authLoading } = useAuth()

  const [session, setSession] = useState(null)
  const [me, setMe] = useState(null)
  const [campers, setCampers] = useState([])
  // { camperId -> status } for quick lookup + optimistic UI.
  const [statusByCamper, setStatusByCamper] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authSession) return
    loadAll()
  }, [sessionId, authSession])

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: sessionRow },
      { data: counselorRow },
    ] = await Promise.all([
      supabase
        .from('sessions')
        .select('*, camps(slug, name, primary_color)')
        .eq('id', sessionId)
        .maybeSingle(),
      supabase
        .from('counselors')
        .select('*')
        .eq('user_id', authSession.user.id)
        .maybeSingle(),
    ])

    setSession(sessionRow)
    setMe(counselorRow)

    // Only bother fetching campers if we have a valid session + counselor.
    if (sessionRow && counselorRow) {
      const [{ data: camperRows }, { data: attendanceRows }] = await Promise.all([
        supabase
          .from('campers')
          .select('*')
          .eq('counselor_id', counselorRow.id)
          .order('last_name'),
        supabase
          .from('attendance')
          .select('*')
          .eq('session_id', sessionId),
      ])
      setCampers(camperRows ?? [])

      const map = {}
      for (const row of attendanceRows ?? []) {
        map[row.camper_id] = row.status
      }
      setStatusByCamper(map)
    }

    setLoading(false)
  }

  async function markStatus(camperId, status) {
    const prev = statusByCamper
    // Optimistic UI.
    setStatusByCamper((s) => ({ ...s, [camperId]: status }))

    // Upsert: one row per (session, camper). If it exists, update; if not, insert.
    const { error: upsertError } = await supabase
      .from('attendance')
      .upsert(
        {
          session_id: sessionId,
          camper_id: camperId,
          status,
          marked_by: authSession.user.id,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,camper_id' },
      )

    if (upsertError) {
      setStatusByCamper(prev) // revert
      setError(upsertError.message)
    }
  }

  if (authLoading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!authSession) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (loading) return <div className="p-12 text-center text-gray-400">Loading attendance…</div>

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Session not found</h1>
        <Link to={`/${campSlug}/counselor`} className="mt-6 text-emerald-700 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  // Are we actually the counselor for this session?
  const isMySession = me && session.counselor_id === me.id
  if (!isMySession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Not your session</h1>
        <p className="mt-2 text-gray-600">
          You aren't assigned to this session, so you can't take attendance for it.
        </p>
        <Link to={`/${campSlug}/counselor`} className="mt-6 text-emerald-700 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const color = session.camps?.primary_color || '#059669'
  const counts = {
    present: campers.filter((c) => statusByCamper[c.id] === 'present').length,
    absent: campers.filter((c) => statusByCamper[c.id] === 'absent').length,
    late: campers.filter((c) => statusByCamper[c.id] === 'late').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to={`/${campSlug}/counselor`} className="text-sm text-emerald-700 hover:underline">
            &larr; Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm uppercase tracking-wide" style={{ color }}>Attendance</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{session.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(session.session_date)}
          {session.start_time && ` · ${formatTime(session.start_time)}`}
          {session.end_time && ` – ${formatTime(session.end_time)}`}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Summary counts */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <SummaryCard label="Present" count={counts.present} tone="green" />
          <SummaryCard label="Late" count={counts.late} tone="amber" />
          <SummaryCard label="Absent" count={counts.absent} tone="red" />
        </div>

        {/* Per-camper list */}
        <section className="mt-8">
          {campers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              You don't have any campers assigned yet. Ask the camp admin to assign kids to you.
            </div>
          ) : (
            <div className="space-y-2">
              {campers.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {c.first_name} {c.last_name}
                    </div>
                    {c.date_of_birth && (
                      <div className="text-xs text-gray-500">DOB {c.date_of_birth}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <StatusButton
                      current={statusByCamper[c.id]}
                      status="present"
                      onClick={() => markStatus(c.id, 'present')}
                    />
                    <StatusButton
                      current={statusByCamper[c.id]}
                      status="late"
                      onClick={() => markStatus(c.id, 'late')}
                    />
                    <StatusButton
                      current={statusByCamper[c.id]}
                      status="absent"
                      onClick={() => markStatus(c.id, 'absent')}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatusButton({ current, status, onClick }) {
  const selected = current === status
  const bg = {
    present: 'bg-emerald-600 hover:bg-emerald-700',
    late: 'bg-amber-500 hover:bg-amber-600',
    absent: 'bg-red-600 hover:bg-red-700',
  }[status]
  const label = { present: 'Present', late: 'Late', absent: 'Absent' }[status]
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? `${bg} rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm`
          : 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
      }
    >
      {label}
    </button>
  )
}

function SummaryCard({ label, count, tone }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }[tone]
  return (
    <div className={`${toneClass} rounded-xl p-4`}>
      <div className="text-xs font-medium uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-3xl font-bold">{count}</div>
    </div>
  )
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
