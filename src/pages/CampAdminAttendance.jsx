import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// Owner attendance report — one row per session with counts of
// present / late / absent, plus the counselor who leads it.
export default function CampAdminAttendance() {
  const { campSlug } = useParams()
  const location = useLocation()
  const { session, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    ;(async () => {
      setLoading(true)

      const { data: campRow } = await supabase
        .from('camps')
        .select('id, slug, name')
        .eq('slug', campSlug)
        .maybeSingle()
      setCamp(campRow)

      if (!campRow) {
        setLoading(false)
        return
      }

      // Get every session with the counselor's name joined in.
      const { data: sessionRows } = await supabase
        .from('sessions')
        .select('id, title, session_date, start_time, counselor_id, counselors(name)')
        .eq('camp_id', campRow.id)
        .order('session_date', { ascending: false })
        .order('start_time', { ascending: false, nullsFirst: false })

      // Get every attendance record for these sessions in one query,
      // then bucket in memory. Avoids N per-session queries.
      const sessionIds = (sessionRows ?? []).map((s) => s.id)
      const { data: attendanceRows } =
        sessionIds.length === 0
          ? { data: [] }
          : await supabase
              .from('attendance')
              .select('session_id, status')
              .in('session_id', sessionIds)

      const countsBySession = {}
      for (const row of attendanceRows ?? []) {
        if (!countsBySession[row.session_id]) {
          countsBySession[row.session_id] = { present: 0, late: 0, absent: 0 }
        }
        countsBySession[row.session_id][row.status]++
      }

      setRows(
        (sessionRows ?? []).map((s) => ({
          ...s,
          counts: countsBySession[s.id] ?? { present: 0, late: 0, absent: 0 },
        })),
      )
      setLoading(false)
    })()
  }, [campSlug, session])

  if (authLoading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (loading) return <div className="p-12 text-center text-gray-400">Loading attendance…</div>

  if (!camp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Camp not found</h1>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">Go home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to={`/${camp.slug}/admin`} className="text-sm text-emerald-700 hover:underline">
            &larr; Admin
          </Link>
          <Link
            to={`/${camp.slug}/admin/sessions`}
            className="text-sm text-gray-500 hover:text-emerald-700"
          >
            Schedule &rarr;
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Per-session breakdown across all of {camp.name}.
        </p>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No sessions scheduled yet.{' '}
            <Link to={`/${camp.slug}/admin/sessions`} className="font-medium text-emerald-700 hover:underline">
              Add one
            </Link>
            .
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Counselor</th>
                  <th className="px-4 py-3 text-center">Present</th>
                  <th className="px-4 py-3 text-center">Late</th>
                  <th className="px-4 py-3 text-center">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.session_date)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.counselors?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Count value={s.counts.present} tone="green" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Count value={s.counts.late} tone="amber" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Count value={s.counts.absent} tone="red" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function Count({ value, tone }) {
  if (value === 0) return <span className="text-gray-300">0</span>
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`${tones[tone]} inline-flex min-w-8 justify-center rounded-md px-2 py-0.5 font-semibold`}>
      {value}
    </span>
  )
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
