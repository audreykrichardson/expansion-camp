import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// Counselor's view of a camp. Different from the admin: counselors can only
// see basic info about their camp and their own record. No camper roster
// (yet — that's a future feature), no settings.
export default function CounselorDashboard() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, user, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [me, setMe] = useState(null)
  const [myCampers, setMyCampers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    ;(async () => {
      setLoading(true)
      const [{ data: campRow }, { data: counselorRow }] = await Promise.all([
        supabase
          .from('camps')
          .select('id, slug, name, tagline, primary_color, logo_url')
          .eq('slug', campSlug)
          .maybeSingle(),
        supabase
          .from('counselors')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ])
      setCamp(campRow)

      // Only show this as "your" dashboard if you're a counselor of this camp.
      if (counselorRow && campRow && counselorRow.camp_id === campRow.id) {
        setMe(counselorRow)
        // Pull the campers assigned to this counselor. RLS restricts this to
        // just the ones with counselor_id = this counselor.
        const { data: camperRows } = await supabase
          .from('campers')
          .select('*')
          .eq('counselor_id', counselorRow.id)
          .order('last_name')
        setMyCampers(camperRows ?? [])
      }
      setLoading(false)
    })()
  }, [campSlug, session])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (authLoading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>

  if (!camp || !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Not a counselor here</h1>
        <p className="mt-2 text-gray-600">
          You're signed in as <span className="font-mono">{user.email}</span>, but you're not a
          counselor at <span className="font-mono">{campSlug}</span>.
        </p>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">Go home</Link>
      </div>
    )
  }

  const color = camp.primary_color || '#059669'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold" style={{ color }}>
            {camp.name}
          </span>
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
        <p className="text-sm uppercase tracking-wide" style={{ color }}>Counselor</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Welcome, {me.name}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          You're a {me.role} at {camp.name}.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Your schedule</div>
            <div className="mt-1 text-xl font-semibold text-gray-300">Coming soon</div>
            <p className="mt-2 text-xs text-gray-400">
              Sessions you're assigned to will show here.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Your campers</div>
            <div className="mt-1 text-3xl font-bold" style={{ color }}>
              {myCampers.length}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {myCampers.length === 0
                ? "You haven't been assigned any campers yet."
                : 'Assigned to you by the camp admin.'}
            </p>
          </div>
        </div>

        {/* Full roster of assigned kids — only if any. */}
        {myCampers.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Your campers ({myCampers.length})
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">DOB</th>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myCampers.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.date_of_birth ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.parent_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{c.parent_email}</div>
                        {c.parent_phone && <div className="text-xs">{c.parent_phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.notes ? (
                          <span className="whitespace-pre-wrap">{c.notes}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
