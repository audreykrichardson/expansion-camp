import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// Turn a camp name into a URL-safe slug. "Roosevelt Basketball!" -> "roosevelt-basketball"
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric -> dash
    .replace(/^-+|-+$/g, '')      // trim leading/trailing dashes
}

export default function Signup() {
  const navigate = useNavigate()

  const [campName, setCampName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false) // user typed their own slug
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // When camp name changes, auto-fill the slug — but only if the user hasn't
  // started editing the slug themselves.
  function handleCampNameChange(value) {
    setCampName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    // Basic validation
    if (!campName || !slug || !email || !password) {
      setError('Please fill in every field.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    // Step 1: create the auth user.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setSubmitting(false)
      setError(signUpError.message)
      return
    }

    // If email confirmation is on, there's no session yet and we can't insert
    // the camp row (RLS needs an authenticated user). Tell them what to do.
    if (!signUpData.session) {
      setSubmitting(false)
      setError(
        'Check your email for a confirmation link, then sign in to finish creating your camp.',
      )
      return
    }

    // Step 2: create the camp row, owned by the new user.
    const { error: campError } = await supabase.from('camps').insert({
      slug,
      name: campName,
      owner_user_id: signUpData.user.id,
    })

    if (campError) {
      setSubmitting(false)
      // The most common error here is a duplicate slug.
      if (campError.code === '23505') {
        setError(`The URL "${slug}" is already taken. Pick a different one.`)
      } else {
        setError(campError.message)
      }
      return
    }

    // Step 3: off to their new admin dashboard.
    navigate(`/${slug}/admin`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/" className="text-sm text-emerald-700 hover:underline">
          &larr; Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Start your camp</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create your free Expansion Camp account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Camp name</label>
            <input
              type="text"
              value={campName}
              onChange={(e) => handleCampNameChange(e.target.value)}
              placeholder="Roosevelt Basketball Day Camp"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your camp's URL
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <span className="pl-3 text-sm text-gray-500">expansioncamp.com/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value))
                  setSlugTouched(true)
                }}
                placeholder="roosevelt"
                className="w-full bg-transparent px-1 py-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create camp'}
          </button>
        </form>
      </div>
    </div>
  )
}
