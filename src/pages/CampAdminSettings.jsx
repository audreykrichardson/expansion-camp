import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// Settings page where a camp owner edits branding (name, tagline, color).
// RLS guards the UPDATE — only the owner can change their own camp.
export default function CampAdminSettings() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state — kept separate from `camp` so unsaved edits don't pollute it.
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#059669')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    supabase
      .from('camps')
      .select('id, slug, name, tagline, primary_color')
      .eq('slug', campSlug)
      .maybeSingle()
      .then(({ data }) => {
        setCamp(data)
        if (data) {
          setName(data.name ?? '')
          setTagline(data.tagline ?? '')
          setPrimaryColor(data.primary_color ?? '#059669')
        }
        setLoading(false)
      })
  }, [campSlug, session])

  async function handleSave(event) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('camps')
      .update({
        name,
        tagline: tagline || null,
        primary_color: primaryColor,
      })
      .eq('id', camp.id)

    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSaved(true)
  }

  if (authLoading) return <div className="p-12 text-center text-gray-400">Loading…</div>
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>
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
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to={`/${camp.slug}/admin`} className="text-sm text-emerald-700 hover:underline">
            &larr; Admin
          </Link>
          <Link to={`/${camp.slug}`} className="text-sm text-gray-500 hover:text-emerald-700">
            View public page &rarr;
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Customize how your camp's pages look.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <label className="block text-sm font-medium text-gray-700">Camp name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <label className="block text-sm font-medium text-gray-700">Tagline</label>
            <p className="mt-1 text-xs text-gray-500">
              Short line shown under your camp name on the public page.
            </p>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Building basketball skills for grades 5-8"
              maxLength={120}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <label className="block text-sm font-medium text-gray-700">Primary color</label>
            <p className="mt-1 text-xs text-gray-500">
              Used for buttons and accents on your camp's pages.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-16 cursor-pointer rounded-lg border border-gray-300"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                style={{ backgroundColor: primaryColor }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Sample button
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {saved && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Saved. Visit your{' '}
              <Link to={`/${camp.slug}`} className="font-semibold underline">
                public page
              </Link>{' '}
              to see the changes.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </main>
    </div>
  )
}
