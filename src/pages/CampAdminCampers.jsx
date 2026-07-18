import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'
import Modal from '../components/Modal.jsx'

// Same formatter as the parent registration form.
function formatPhone(input) {
  const digits = input.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Admin view of registered campers. RLS makes sure we only see rows for
// camps the logged-in user owns — but we still verify the URL slug matches
// a camp the user owns, so they get a clean 404 instead of an empty list.
export default function CampAdminCampers() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
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
        .select('id, slug, name, owner_user_id')
        .eq('slug', campSlug)
        .maybeSingle()

      if (cancelled) return

      // Owner-only page. Non-owners get bounced to their counselor dashboard
      // if applicable, or home otherwise.
      if (campRow && campRow.owner_user_id !== session.user.id) {
        const { data: c } = await supabase
          .from('counselors')
          .select('id')
          .eq('camp_id', campRow.id)
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (cancelled) return
        navigate(c ? `/${campRow.slug}/counselor` : '/', { replace: true })
        return
      }

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

  const [assignError, setAssignError] = useState(null)

  // Update the local list optimistically so the dropdown reflects the choice
  // instantly, then persist. If the save fails, revert and surface the error
  // so we don't silently show fake state.
  async function handleAssign(camperId, counselorId) {
    const prev = campers
    const nextValue = counselorId || null
    setCampers((rows) =>
      rows.map((c) => (c.id === camperId ? { ...c, counselor_id: nextValue } : c)),
    )
    setAssignError(null)

    const { error } = await supabase
      .from('campers')
      .update({ counselor_id: nextValue })
      .eq('id', camperId)

    if (error) {
      setCampers(prev) // revert
      setAssignError(`Couldn't save assignment: ${error.message}`)
    }
  }

  // Which camper (if any) is being edited in the modal.
  const [editingCamper, setEditingCamper] = useState(null)

  async function handleSaveCamper(updated) {
    const { error } = await supabase
      .from('campers')
      .update({
        first_name: updated.first_name,
        last_name: updated.last_name,
        date_of_birth: updated.date_of_birth || null,
        parent_name: updated.parent_name,
        parent_email: updated.parent_email,
        parent_phone: updated.parent_phone || null,
        emergency_contact_name: updated.emergency_contact_name || null,
        emergency_contact_phone: updated.emergency_contact_phone || null,
        notes: updated.notes || null,
      })
      .eq('id', editingCamper.id)

    if (error) {
      alert(`Couldn't save: ${error.message}`)
      return
    }
    setCampers((rows) => rows.map((c) => (c.id === editingCamper.id ? { ...c, ...updated } : c)))
    setEditingCamper(null)
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

        {assignError && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {assignError}
          </div>
        )}

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
                  <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingCamper(c)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Edit camper modal */}
      <Modal
        open={!!editingCamper}
        onClose={() => setEditingCamper(null)}
        title="Edit camper"
        wide
      >
        {editingCamper && (
          <EditCamperForm
            initial={editingCamper}
            onCancel={() => setEditingCamper(null)}
            onSave={handleSaveCamper}
          />
        )}
      </Modal>
    </div>
  )
}

function EditCamperForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" value={form.first_name} onChange={(v) => update('first_name', v)} />
        <TextField label="Last name" value={form.last_name} onChange={(v) => update('last_name', v)} />
        <TextField label="Date of birth" type="date" value={form.date_of_birth ?? ''} onChange={(v) => update('date_of_birth', v)} />
        <TextField label="Parent name" value={form.parent_name} onChange={(v) => update('parent_name', v)} />
        <TextField label="Parent email" type="email" value={form.parent_email} onChange={(v) => update('parent_email', v)} />
        <TextField label="Parent phone" value={form.parent_phone ?? ''} onChange={(v) => update('parent_phone', formatPhone(v))} />
        <TextField label="Emergency contact" value={form.emergency_contact_name ?? ''} onChange={(v) => update('emergency_contact_name', v)} />
        <TextField label="Emergency phone" value={form.emergency_contact_phone ?? ''} onChange={(v) => update('emergency_contact_phone', formatPhone(v))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          rows={3}
          value={form.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
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

function TextField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}
