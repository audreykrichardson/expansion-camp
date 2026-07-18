import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// Shrink a user-picked image to a sensible max dimension *in the browser*
// before uploading. Why: phone photos are 3-8 MB; the logo only ever
// displays at ~128px, so anything over ~600px is wasted bytes.
// Returns either the original file (if it's already small or an SVG/vector)
// or a new compressed File.
async function resizeImage(file, maxDim = 600, quality = 0.9) {
  // SVGs are vector — already small, scale infinitely. Don't touch.
  if (file.type === 'image/svg+xml') return file

  const isPng = file.type === 'image/png'
  const url = URL.createObjectURL(file)

  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })

    // Already small enough — skip the round-trip.
    if (img.width <= maxDim && img.height <= maxDim && file.size < 300 * 1024) {
      return file
    }

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)

    const mime = isPng ? 'image/png' : 'image/jpeg'
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
    const newName = file.name.replace(/\.[^.]+$/, isPng ? '.png' : '.jpg')
    return new File([blob], newName, { type: mime })
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Settings page where a camp owner edits branding (name, tagline, color).
// RLS guards the UPDATE — only the owner can change their own camp.
export default function CampAdminSettings() {
  const { campSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  // (owner ownership check is done inside the useEffect below)

  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state — kept separate from `camp` so unsaved edits don't pollute it.
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#059669')
  const [logoUrl, setLogoUrl] = useState(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data } = await supabase
        .from('camps')
        .select('id, slug, name, tagline, primary_color, logo_url, owner_user_id')
        .eq('slug', campSlug)
        .maybeSingle()

      if (cancelled) return

      // Owner-only page.
      if (data && data.owner_user_id !== session.user.id) {
        const { data: c } = await supabase
          .from('counselors')
          .select('id')
          .eq('camp_id', data.id)
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (cancelled) return
        navigate(c ? `/${data.slug}/counselor` : '/', { replace: true })
        return
      }

      setCamp(data)
      if (data) {
        setName(data.name ?? '')
        setTagline(data.tagline ?? '')
        setPrimaryColor(data.primary_color ?? '#059669')
        setLogoUrl(data.logo_url ?? null)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [campSlug, session, navigate])

  async function handleLogoFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoError(null)

    // Safety net — even raw files this big are almost certainly the user
    // trying to upload a video by accident. The resize below shrinks
    // anything reasonable down to ~80 KB regardless of input size.
    if (file.size > 20 * 1024 * 1024) {
      setLogoError('File is too large (max 20 MB).')
      return
    }

    setUploadingLogo(true)

    let processed
    try {
      processed = await resizeImage(file)
    } catch {
      setUploadingLogo(false)
      setLogoError("Couldn't process this image. Try a different file.")
      return
    }

    const ext = processed.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${camp.slug}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('camp-logos')
      .upload(path, processed, { contentType: processed.type })

    if (uploadError) {
      setUploadingLogo(false)
      setLogoError(uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('camp-logos')
      .getPublicUrl(path)
    const publicUrl = publicUrlData.publicUrl

    // Save the new URL to the camp row.
    const { error: updateError } = await supabase
      .from('camps')
      .update({ logo_url: publicUrl })
      .eq('id', camp.id)

    setUploadingLogo(false)
    if (updateError) {
      setLogoError(updateError.message)
      return
    }
    setLogoUrl(publicUrl)
    event.target.value = '' // let them upload the same file again later
  }

  async function handleRemoveLogo() {
    setLogoError(null)
    const { error: updateError } = await supabase
      .from('camps')
      .update({ logo_url: null })
      .eq('id', camp.id)
    if (updateError) {
      setLogoError(updateError.message)
      return
    }
    setLogoUrl(null)
  }

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
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <p className="mt-1 text-xs text-gray-500">
              Image shown above your camp name on the public page. Any size works
              &mdash; we'll shrink it automatically.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Tip: PNG or SVG with a transparent background looks best.
            </p>

            {logoUrl ? (
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <img
                    src={logoUrl}
                    alt="Camp logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFile}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-sm font-medium text-gray-500 hover:border-emerald-400 hover:bg-emerald-50">
                {uploadingLogo ? 'Uploading…' : 'Click to upload a logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
            )}

            {logoError && (
              <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {logoError}
              </div>
            )}
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
