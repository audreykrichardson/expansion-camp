import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// Public-facing home page for a camp. No login required — this is what
// parents see when they visit roosevelt.expansioncamp.com (or /roosevelt).
export default function CampHome() {
  const { campSlug } = useParams()
  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('camps')
      .select('id, slug, name, created_at')
      .eq('slug', campSlug)
      .maybeSingle()
      .then(({ data }) => {
        setCamp(data)
        setLoading(false)
      })
  }, [campSlug])

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>
  }

  if (!camp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Camp not found</h1>
        <p className="mt-2 text-gray-600">
          We couldn't find a camp at <span className="font-mono">/{campSlug}</span>.
        </p>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-sm uppercase tracking-wide text-emerald-600">Summer camp</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
          {camp.name}
        </h1>
        <p className="mt-4 text-gray-600">
          Register your child for this summer's camp.
        </p>
        <Link
          to={`/${camp.slug}/register`}
          className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Register your child
        </Link>
      </div>
    </div>
  )
}
