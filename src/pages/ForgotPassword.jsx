import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// "Forgot password" — enter an email, we send a reset link. We show the same
// "check your email" confirmation on success whether or not the email is
// registered (Supabase doesn't reveal which emails exist), so this form can't
// be used to fish for who has an account.
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!email) {
      setError('Please enter your email.')
      return
    }

    setSubmitting(true)
    // The link in the email brings them back to /reset-password to set a new one.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    // Any error here is a real system issue (e.g. rate limit, network) — worth
    // showing. Supabase returns success for unknown emails, so this never leaks
    // whether the account exists.
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-2 text-sm text-gray-600">
            If an account exists for <span className="font-mono">{email}</span>, we've sent a
            link to reset your password. It expires in about an hour.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-emerald-700 hover:underline"
          >
            &larr; Back to log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/login" className="text-sm text-emerald-700 hover:underline">
          &larr; Back to log in
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Forgot your password?</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we'll send you a link to reset it.
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

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}
