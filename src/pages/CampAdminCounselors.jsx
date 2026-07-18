import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'
import Modal from '../components/Modal.jsx'

// Same formatter as the parent registration form: caps at 10 digits and
// formats as (555) 123-4567 while typing.
function formatPhone(input) {
  const digits = input.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Admin view: list + invite + remove counselors.
export default function CampAdminCounselors() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [counselors, setCounselors] = useState([])
  const [loading, setLoading] = useState(true)

  // Invite form state.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Counselor')
  const [phone, setPhone] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [justInvitedId, setJustInvitedId] = useState(null)

  // Per-row "copied!" feedback.
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!session) return
    loadAll()
  }, [campSlug, session])

  async function loadAll() {
    setLoading(true)
    const { data: campRow } = await supabase
      .from('camps')
      .select('id, slug, name, owner_user_id')
      .eq('slug', campSlug)
      .maybeSingle()

    // Owner-only page.
    if (campRow && campRow.owner_user_id !== session.user.id) {
      const { data: c } = await supabase
        .from('counselors')
        .select('id')
        .eq('camp_id', campRow.id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      navigate(c ? `/${campRow.slug}/counselor` : '/', { replace: true })
      return
    }

    setCamp(campRow)

    if (campRow) {
      const { data: rows } = await supabase
        .from('counselors')
        .select('*')
        .eq('camp_id', campRow.id)
        .order('created_at', { ascending: false })
      setCounselors(rows ?? [])
    }
    setLoading(false)
  }

  async function handleInvite(event) {
    event.preventDefault()
    setInviteError(null)

    if (!name || !email) {
      setInviteError('Name and email are required.')
      return
    }

    setInviting(true)
    const { data, error } = await supabase
      .from('counselors')
      .insert({
        camp_id: camp.id,
        name,
        email,
        role: role || 'Counselor',
        phone: phone || null,
      })
      .select()
      .single()

    setInviting(false)

    if (error) {
      if (error.code === '23505') {
        setInviteError('That email is already invited to this camp.')
      } else {
        setInviteError(error.message)
      }
      return
    }

    // Reset form, refresh list, highlight the new one.
    setName('')
    setEmail('')
    setRole('Counselor')
    setPhone('')
    setJustInvitedId(data.id)
    loadAll()
  }

  async function handleRemove(counselorId) {
    if (!confirm('Remove this counselor?')) return
    await supabase.from('counselors').delete().eq('id', counselorId)
    loadAll()
  }

  // Which counselor is being edited in the modal.
  const [editingCounselor, setEditingCounselor] = useState(null)

  async function handleSaveCounselor(updated) {
    const { error: updateError } = await supabase
      .from('counselors')
      .update({
        name: updated.name,
        email: updated.email,
        role: updated.role || 'Counselor',
        phone: updated.phone || null,
      })
      .eq('id', editingCounselor.id)

    if (updateError) {
      alert(`Couldn't save: ${updateError.message}`)
      return
    }
    setEditingCounselor(null)
    loadAll()
  }

  function inviteLink(token) {
    return `${window.location.origin}/${camp.slug}/join/${token}`
  }

  async function copyLink(c) {
    await navigator.clipboard.writeText(inviteLink(c.invite_token))
    setCopiedId(c.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (authLoading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (loading) return <div className="p-12 text-center text-gray-400">Loading counselors…</div>
  if (!camp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Camp not found</h1>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">Go home</Link>
      </div>
    )
  }

  const pending = counselors.filter((c) => !c.user_id)
  const joined = counselors.filter((c) => c.user_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to={`/${camp.slug}/admin`} className="text-sm text-emerald-700 hover:underline">
            &larr; Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Counselors</h1>
        <p className="mt-1 text-sm text-gray-500">{counselors.length} on staff at {camp.name}.</p>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Invite a counselor</h2>
          <p className="mt-1 text-sm text-gray-500">
            They'll get a shareable link to sign up. They can use any email for their login.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Name *" value={name} onChange={setName} placeholder="Jamie Doe" />
            <Input label="Email *" type="email" value={email} onChange={setEmail} placeholder="jamie@example.com" />
            <Input label="Role" value={role} onChange={setRole} placeholder="Counselor" />
            <Input label="Phone" type="tel" value={phone} onChange={setPhone} format={formatPhone} placeholder="(555) 123-4567" />
          </div>

          {inviteError && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError}</div>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviting ? 'Creating…' : 'Create invite'}
          </button>
        </form>

        {/* Pending invites */}
        {pending.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Pending invites ({pending.length})
            </h2>
            <div className="mt-3 space-y-3">
              {pending.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl border bg-white p-4 ${
                    justInvitedId === c.id ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.email} &middot; {c.role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(c.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <code className="flex-1 truncate text-xs text-gray-700">{inviteLink(c.invite_token)}</code>
                    <button
                      type="button"
                      onClick={() => copyLink(c)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {copiedId === c.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Joined counselors */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Staff ({joined.length})
          </h2>
          {joined.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              No counselors have joined yet. Send them an invite above.
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {joined.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.role}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{c.email}</div>
                        {c.phone && <div className="text-xs">{c.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.invite_accepted_at
                          ? new Date(c.invite_accepted_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setEditingCounselor(c)}
                            className="text-emerald-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(c.id)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Edit counselor modal */}
      <Modal
        open={!!editingCounselor}
        onClose={() => setEditingCounselor(null)}
        title="Edit counselor"
      >
        {editingCounselor && (
          <EditCounselorForm
            initial={editingCounselor}
            onCancel={() => setEditingCounselor(null)}
            onSave={handleSaveCounselor}
          />
        )}
      </Modal>
    </div>
  )
}

function EditCounselorForm({ initial, onCancel, onSave }) {
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
      <Input label="Name" value={form.name} onChange={(v) => update('name', v)} />
      <Input label="Contact email" type="email" value={form.email} onChange={(v) => update('email', v)} />
      <Input label="Role" value={form.role ?? ''} onChange={(v) => update('role', v)} placeholder="Counselor" />
      <Input label="Phone" value={form.phone ?? ''} onChange={(v) => update('phone', v)} format={formatPhone} placeholder="(555) 123-4567" />
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

function Input({ label, value, onChange, type = 'text', placeholder, format }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(format ? format(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}
