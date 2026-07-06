import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// Admin view of registered campers. RLS makes sure we only see rows for
// camps the logged-in user owns — but we still verify the URL slug matches
// a camp the user owns, so they get a clean 404 instead of an empty list.
export default function CampAdminCampers() {
  const { campSlug } = useParams()
  const location = useLocation()
  const { session, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [campers, setCampers] = useState([])
  // Counselors are used to populate the assignment dropdown per camper.
  const [counselors, setCounselors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data: campRow } = await supabase
        .from('camps')
        .select('id, slug, name')
        .eq('slug', campSlug)
        .maybeSingle()

      if (cancelled) return
      setCamp(campRow)

      if (!campRow) {
        setCampers([])
        setCounselors([])
        setLoading(false)
        return
      }

      const [{ data: camperRows }, { data: counselorRows }] = await Promise.all([
        supabase
          .from('campers')
          .select('*')
          .eq('camp_id', campRow.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('counselors')
          .select('id, name, role')
          // Only claimed counselors show up in the dropdown — no point in
          // "assigning" a pending invite.
          .not('user_id', 'is', null)
          .eq('camp_id', campRow.id)
          .order('name'),
      ])

      if (cancelled) return
      setCampers(camperRows ?? [])
      setCounselors(counselorRows ?? [])
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [campSlug, session])

  // Update the local list optimistically so the dropdown reflects the choice
  // instantly, then persist.
  async function handleAssign(camperId, counselorId) {
    setCampers((prev) =>
      prev.map((c) => (c.id === camperId ? { ...c, counselor_id: counselorId || null } : c)),
    )
    await supabase
      .from('campers')
      .update({ counselor_id: counselorId || null })
      .eq('id', camperId)
  }

  if (authLoading) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>
  }
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading campers…</div>
  }
  if (!camp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Camp not found</h1>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to={`/${camp.slug}/admin`}
            className="text-sm text-emerald-700 hover:underline"
          >
            &larr; Admin
          </Link>
          <Link to={`/${camp.slug}/register`} className="text-sm text-gray-500 hover:text-emerald-700">
            Public registration page &rarr;
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Campers</h1>
        <p className="mt-1 text-sm text-gray-500">
          {campers.length} registered for {camp.name}.
        </p>

        {campers.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            No one has registered yet.
            <div className="mt-2 text-sm">
              Share your registration link:{' '}
              <span className="font-mono text-gray-700">
                {window.location.host}/{camp.slug}/register
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">DOB</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Counselor</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campers.map((c) => (
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
                    <td className="px-4 py-3">
                      {counselors.length === 0 ? (
                        <span className="text-xs text-gray-400">No counselors yet</span>
                      ) : (
                        <select
                          value={c.counselor_id ?? ''}
                          onChange={(e) => handleAssign(c.id, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">— Unassigned —</option>
                          {counselors.map((co) => (
                            <option key={co.id} value={co.id}>
                              {co.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
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
