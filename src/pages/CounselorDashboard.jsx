import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'
import Modal from '../components/Modal.jsx'

// Same phone formatter used across the app.
function formatPhone(input) {
  const digits = input.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

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
  const [mySessions, setMySessions] = useState([])
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
        const [{ data: camperRows }, { data: sessionRows }] = await Promise.all([
          supabase
            .from('campers')
            .select('*')
            .eq('counselor_id', counselorRow.id)
            .order('last_name'),
          supabase
            .from('sessions')
            .select('*')
            .eq('counselor_id', counselorRow.id)
            .order('session_date', { ascending: true })
            .order('start_time', { ascending: true, nullsFirst: false }),
        ])
        setMyCampers(camperRows ?? [])
        setMySessions(sessionRows ?? [])
      }
      setLoading(false)
    })()
  }, [campSlug, session])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const [editingProfile, setEditingProfile] = useState(false)

  async function handleSaveProfile(updated) {
    const { error } = await supabase
      .from('counselors')
      .update({
        name: updated.name,
        phone: updated.phone || null,
      })
      .eq('id', me.id)

    if (error) {
      alert(`Couldn't save: ${error.message}`)
      return
    }
    setMe((prev) => ({ ...prev, ...updated }))
    setEditingProfile(false)
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
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="text-sm font-medium text-gray-700 hover:text-emerald-700"
            >
              Edit profile
            </button>
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
            <div className="mt-1 text-3xl font-bold" style={{ color }}>
              {mySessions.length}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {mySessions.length === 0
                ? "You haven't been assigned any sessions yet."
                : 'Sessions you lead. See below for details.'}
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

        {/* Upcoming sessions — clickable → attendance page for that session */}
        {mySessions.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Your schedule ({mySessions.length})
            </h2>
            <div className="mt-3 space-y-3">
              {mySessions.map((s) => (
                <Link
                  key={s.id}
                  to={`/${camp.slug}/counselor/sessions/${s.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
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
                    <span className="whitespace-nowrap text-xs font-medium text-emerald-700">
                      Take attendance &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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

      {/* Edit-your-own-profile modal */}
      <Modal
        open={editingProfile}
        onClose={() => setEditingProfile(false)}
        title="Edit your profile"
      >
        {me && (
          <EditProfileForm
            initial={me}
            onCancel={() => setEditingProfile(false)}
            onSave={handleSaveProfile}
          />
        )}
      </Modal>
    </div>
  )
}

function EditProfileForm({ initial, onCancel, onSave }) {
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, phone })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(555) 123-4567"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <p className="text-xs text-gray-500">
        To change your login email or role, ask the camp admin.
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
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
