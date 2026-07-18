import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'
import DatePicker from '../components/DatePicker.jsx'
import TimePicker from '../components/TimePicker.jsx'
import Modal from '../components/Modal.jsx'

// Admin schedule view — owner creates sessions (activity blocks) and
// optionally assigns each to a counselor.
export default function CampAdminSessions() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session: authSession, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [sessions, setSessions] = useState([])
  const [counselors, setCounselors] = useState([])
  const [loading, setLoading] = useState(true)

  // New session form state.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [counselorId, setCounselorId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authSession) return
    loadAll()
  }, [campSlug, authSession])

  async function loadAll() {
    setLoading(true)
    const { data: campRow } = await supabase
      .from('camps')
      .select('id, slug, name, owner_user_id')
      .eq('slug', campSlug)
      .maybeSingle()

    // Owner-only page.
    if (campRow && campRow.owner_user_id !== authSession.user.id) {
      const { data: c } = await supabase
        .from('counselors')
        .select('id')
        .eq('camp_id', campRow.id)
        .eq('user_id', authSession.user.id)
        .maybeSingle()
      navigate(c ? `/${campRow.slug}/counselor` : '/', { replace: true })
      return
    }

    setCamp(campRow)

    if (campRow) {
      const [{ data: sessionRows }, { data: counselorRows }] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('camp_id', campRow.id)
          .order('session_date', { ascending: true })
          .order('start_time', { ascending: true, nullsFirst: false }),
        supabase
          .from('counselors')
          .select('id, name')
          .eq('camp_id', campRow.id)
          .not('user_id', 'is', null)
          .order('name'),
      ])
      const rows = sessionRows ?? []
      setSessions(rows)
      setCounselors(counselorRows ?? [])

      // Fetch attendance counts per session in one query, then bucket.
      const sessionIds = rows.map((s) => s.id)
      if (sessionIds.length > 0) {
        const { data: attendanceRows } = await supabase
          .from('attendance')
          .select('session_id, status')
          .in('session_id', sessionIds)
        const buckets = {}
        for (const a of attendanceRows ?? []) {
          if (!buckets[a.session_id]) {
            buckets[a.session_id] = { present: 0, late: 0, absent: 0 }
          }
          buckets[a.session_id][a.status]++
        }
        setAttendanceCounts(buckets)
      } else {
        setAttendanceCounts({})
      }
    }
    setLoading(false)
  }

  // { sessionId -> {present, late, absent} }
  const [attendanceCounts, setAttendanceCounts] = useState({})

  async function handleCreate(event) {
    event.preventDefault()
    setError(null)

    if (!title || !date) {
      setError('Title and date are required.')
      return
    }

    setCreating(true)
    const { error: insertError } = await supabase.from('sessions').insert({
      camp_id: camp.id,
      title,
      description: description || null,
      session_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      counselor_id: counselorId || null,
    })
    setCreating(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setTitle('')
    setDescription('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setCounselorId('')
    loadAll()
  }

  async function handleAssign(sessionId, newCounselorId) {
    const nextValue = newCounselorId || null
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, counselor_id: nextValue } : s)),
    )
    await supabase
      .from('sessions')
      .update({ counselor_id: nextValue })
      .eq('id', sessionId)
  }

  async function handleDelete(sessionId) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', sessionId)
    loadAll()
  }

  // Which session is being edited in the modal.
  const [editingSession, setEditingSession] = useState(null)

  async function handleSaveSession(updated) {
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        title: updated.title,
        description: updated.description || null,
        session_date: updated.session_date,
        start_time: updated.start_time || null,
        end_time: updated.end_time || null,
        counselor_id: updated.counselor_id || null,
      })
      .eq('id', editingSession.id)

    if (updateError) {
      alert(`Couldn't save: ${updateError.message}`)
      return
    }
    setEditingSession(null)
    loadAll()
  }

  // Which session is being duplicated + the date the user picked for the copy.
  const [duplicatingId, setDuplicatingId] = useState(null)
  const [duplicateDate, setDuplicateDate] = useState('')

  function startDuplicate(sessionRow) {
    setDuplicatingId(sessionRow.id)
    setDuplicateDate('') // parent picks fresh
  }

  async function handleDuplicate(sessionRow) {
    if (!duplicateDate) return
    const { error: insertError } = await supabase.from('sessions').insert({
      camp_id: sessionRow.camp_id,
      title: sessionRow.title,
      description: sessionRow.description,
      session_date: duplicateDate,
      start_time: sessionRow.start_time,
      end_time: sessionRow.end_time,
      counselor_id: sessionRow.counselor_id,
    })
    if (insertError) {
      alert(`Couldn't duplicate: ${insertError.message}`)
      return
    }
    setDuplicatingId(null)
    setDuplicateDate('')
    loadAll()
  }

  function counselorName(id) {
    if (!id) return 'Unassigned'
    return counselors.find((c) => c.id === id)?.name ?? 'Unknown'
  }

  if (authLoading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!authSession) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (loading) return <div className="p-12 text-center text-gray-400">Loading sessions…</div>
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
            to={`/${camp.slug}/admin/attendance`}
            className="text-sm text-gray-500 hover:text-emerald-700"
          >
            Attendance report &rarr;
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        <p className="mt-1 text-sm text-gray-500">
          {sessions.length} session{sessions.length === 1 ? '' : 's'} at {camp.name}.
        </p>

        {/* Create session form */}
        <form onSubmit={handleCreate} className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Add a session</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Morning Basketball"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional details about this session."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date *</label>
              <div className="mt-1">
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign counselor</label>
              <select
                value={counselorId}
                onChange={(e) => setCounselorId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">— Unassigned —</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start time</label>
              <div className="mt-1">
                <TimePicker value={startTime} onChange={setStartTime} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End time</label>
              <div className="mt-1">
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Adding…' : 'Add session'}
          </button>
        </form>

        {/* Existing sessions */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Upcoming ({sessions.length})
          </h2>
          {sessions.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              No sessions yet. Add one above.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{s.title}</span>
                        <AttendanceBadge counts={attendanceCounts[s.id]} />
                      </div>
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
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setEditingSession(s)}
                        className="text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => startDuplicate(s)}
                        className="text-emerald-700 hover:underline"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Counselor:</span>
                    {counselors.length === 0 ? (
                      <span className="text-xs text-gray-400">No counselors yet</span>
                    ) : (
                      <select
                        value={s.counselor_id ?? ''}
                        onChange={(e) => handleAssign(s.id, e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">— Unassigned —</option>
                        {counselors.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Duplicate form — appears inline when the user clicks Duplicate */}
                  {duplicatingId === s.id && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-medium text-emerald-900">
                        Copy this session to a new date
                      </div>
                      <p className="mt-1 text-xs text-emerald-700">
                        Everything else (title, times, counselor) stays the same.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="min-w-[220px]">
                          <DatePicker value={duplicateDate} onChange={setDuplicateDate} />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(s)}
                          disabled={!duplicateDate}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuplicatingId(null)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit session modal */}
      <Modal
        open={!!editingSession}
        onClose={() => setEditingSession(null)}
        title="Edit session"
        wide
      >
        {editingSession && (
          <EditSessionForm
            initial={editingSession}
            counselors={counselors}
            onCancel={() => setEditingSession(null)}
            onSave={handleSaveSession}
          />
        )}
      </Modal>
    </div>
  )
}

function EditSessionForm({ initial, counselors, onCancel, onSave }) {
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={2}
          value={form.description ?? ''}
          onChange={(e) => update('description', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <DatePicker value={form.session_date ?? ''} onChange={(v) => update('session_date', v)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Counselor</label>
          <select
            value={form.counselor_id ?? ''}
            onChange={(e) => update('counselor_id', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">— Unassigned —</option>
            {counselors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start time</label>
          <div className="mt-1">
            <TimePicker value={form.start_time ?? ''} onChange={(v) => update('start_time', v)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End time</label>
          <div className="mt-1">
            <TimePicker value={form.end_time ?? ''} onChange={(v) => update('end_time', v)} />
          </div>
        </div>
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

// "2026-07-15" -> "Wed, Jul 15, 2026"
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// "14:30:00" -> "2:30 PM"
function formatTime(t) {
  const [h, m] = t.split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m), 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// Small pill showing at-a-glance whether attendance has been taken on this
// session. Grey pill = nothing marked yet. Green pill = at least one person
// marked, shows "P / L / A" counts.
function AttendanceBadge({ counts }) {
  if (!counts || (counts.present + counts.late + counts.absent === 0)) {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        No attendance yet
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {counts.present}P · {counts.late}L · {counts.absent}A
    </span>
  )
}
