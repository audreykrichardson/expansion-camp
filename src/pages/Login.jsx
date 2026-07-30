import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getCounselorCamps } from '../lib/counselors.js'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  // When a counselor belongs to 2+ camps we can't guess which one they want,
  // so we hold the list here and show a pick-your-camp screen instead.
  const [campChoices, setCampChoices] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setSubmitting(false)
      setError(signInError.message)
      return
    }

    // Where to go next?
    //   1. If they were trying to reach a specific page, send them there.
    //   2. If they own a camp, go to its admin (owner takes precedence).
    //   3. If they're a counselor somewhere, go to that counselor dashboard.
    //   4. Fallback: go home.
    const intended = location.state?.from
    if (intended) {
      navigate(intended, { replace: true })
      return
    }

    const { data: camps } = await supabase
      .from('camps')
      .select('slug')
      .eq('owner_user_id', data.user.id)
      .limit(1)

    if (camps && camps.length > 0) {
      navigate(`/${camps[0].slug}/admin`, { replace: true })
      return
    }

    // Counselor camps. One → go straight there. Two or more → we can't guess
    // which, so show a picker. None → fall through to home.
    const counselorCamps = await getCounselorCamps(supabase, data.user.id)

    if (counselorCamps.length === 1) {
      navigate(`/${counselorCamps[0].slug}/counselor`, { replace: true })
      return
    }

    if (counselorCamps.length >= 2) {
      setSubmitting(false)
      setCampChoices(counselorCamps)
      return
    }

    navigate('/', { replace: true })
  }

  // A counselor at more than one camp: let them choose which to open.
  if (campChoices) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-2xl font-bold text-gray-900">Choose a camp</h1>
          <p className="mt-2 text-sm text-gray-600">
            You're a counselor at more than one camp. Which one do you want to open?
          </p>

          <div className="mt-8 space-y-3">
            {campChoices.map((camp) => (
              <button
                key={camp.slug}
                type="button"
                onClick={() => navigate(`/${camp.slug}/counselor`, { replace: true })}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 text-left font-medium text-gray-900 transition hover:border-emerald-400 hover:shadow-sm"
              >
                {camp.name}
                <span className="text-emerald-700">&rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/" className="text-sm text-emerald-700 hover:underline">
          &larr; Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Log in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back.{' '}
          <Link to="/signup" className="text-emerald-700 hover:underline">
            Or start a new camp.
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1">
              <PasswordInput value={password} onChange={setPassword} />
            </div>
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
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
