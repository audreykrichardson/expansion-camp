import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// Format whatever the user typed into (555) 123-4567 as they go.
// Works by stripping to digits and rebuilding, so backspace + paste behave.
function formatPhone(input) {
  const digits = input.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Public registration form. Anyone — even not signed in — can submit
// this. RLS only allows the insert if camp_id refers to a real camp.
export default function CampRegister() {
  const { campSlug } = useParams()

  const [camp, setCamp] = useState(null)
  const [campLoading, setCampLoading] = useState(true)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('camps')
      .select('id, slug, name')
      .eq('slug', campSlug)
      .maybeSingle()
      .then(({ data }) => {
        setCamp(data)
        setCampLoading(false)
      })
  }, [campSlug])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!form.first_name || !form.last_name || !form.parent_name || !form.parent_email) {
      setError('Please fill in the required fields (marked with *).')
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('campers').insert({
      camp_id: camp.id,
      first_name: form.first_name,
      last_name: form.last_name,
      // Empty strings -> null so the date column stays clean.
      date_of_birth: form.date_of_birth || null,
      parent_name: form.parent_name,
      parent_email: form.parent_email,
      parent_phone: form.parent_phone || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      notes: form.notes || null,
    })

    if (insertError) {
      setSubmitting(false)
      setError(insertError.message)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  if (campLoading) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>
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

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-50 px-6 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">You're registered!</h1>
        <p className="mt-2 text-gray-600">
          {form.first_name} is signed up for {camp.name}. We'll be in touch with{' '}
          {form.parent_email} about next steps.
        </p>
        <Link to={`/${camp.slug}`} className="mt-6 text-emerald-700 hover:underline">
          Back to camp page
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to={`/${camp.slug}`} className="text-sm text-emerald-700 hover:underline">
          &larr; Back to {camp.name}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Register for {camp.name}</h1>
        <p className="mt-2 text-sm text-gray-600">Fields marked * are required.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Section title="About your child">
            <Field label="First name *" value={form.first_name} onChange={(v) => updateField('first_name', v)} />
            <Field label="Last name *" value={form.last_name} onChange={(v) => updateField('last_name', v)} />
            <DateOfBirthField value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
          </Section>

          <Section title="Parent / guardian">
            <Field label="Your name *" value={form.parent_name} onChange={(v) => updateField('parent_name', v)} />
            <Field label="Email *" type="email" value={form.parent_email} onChange={(v) => updateField('parent_email', v)} />
            <Field label="Phone" type="tel" value={form.parent_phone} onChange={(v) => updateField('parent_phone', v)} format={formatPhone} placeholder="(555) 123-4567" />
          </Section>

          <Section title="Emergency contact">
            <Field label="Name" value={form.emergency_contact_name} onChange={(v) => updateField('emergency_contact_name', v)} />
            <Field label="Phone" type="tel" value={form.emergency_contact_phone} onChange={(v) => updateField('emergency_contact_phone', v)} format={formatPhone} placeholder="(555) 123-4567" />
          </Section>

          <Section title="Anything else?">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allergies, medical notes, special needs
              </label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </Section>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

// Three dropdowns — month, day, year — that combine into a YYYY-MM-DD
// string for the database. Smoother than the native date picker.
function DateOfBirthField({ value, onChange }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [year, setYear] = useState(parts[0])
  const [month, setMonth] = useState(parts[1])
  const [day, setDay] = useState(parts[2])

  function update(y, m, d) {
    setYear(y); setMonth(m); setDay(d)
    onChange(y && m && d ? `${y}-${m}-${d}` : '')
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => String(currentYear - i),
  )

  const months = [
    ['01', 'January'], ['02', 'February'], ['03', 'March'],
    ['04', 'April'], ['05', 'May'], ['06', 'June'],
    ['07', 'July'], ['08', 'August'], ['09', 'September'],
    ['10', 'October'], ['11', 'November'], ['12', 'December'],
  ]

  // Cap days at the real length of the picked month (28/29/30/31).
  const dayCount = year && month
    ? new Date(Number(year), Number(month), 0).getDate()
    : 31
  const days = Array.from({ length: dayCount }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  )

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700">Date of birth</label>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <select value={month} onChange={(e) => update(year, e.target.value, day)} className={selectClass}>
          <option value="">Month</option>
          {months.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select value={day} onChange={(e) => update(year, month, e.target.value)} className={selectClass}>
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d} value={d}>{Number(d)}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => update(e.target.value, month, day)} className={selectClass}>
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', format, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(format ? format(e.target.value) : e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}
