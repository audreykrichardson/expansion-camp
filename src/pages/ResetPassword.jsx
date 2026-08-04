import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import PasswordInput from '../components/PasswordInput.jsx'

// "Set a new password" — where the emailed reset link lands. On page load the
// Supabase client reads the recovery token out of the URL and gives us a
// temporary session, so updateUser can set the new password. Afterward we sign
// out of that temporary session and send them to log in fresh.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setSubmitting(false)
      // Most common cause: the link expired or was already used, so there's no
      // valid recovery session to update.
      setError(
        `${updateError.message}. Your reset link may have expired — request a new one.`,
      )
      return
    }

    // Success. Drop the temporary recovery session and send them to log in.
    await supabase.auth.signOut()
    setSubmitting(false)
    navigate('/login', { replace: true, state: { passwordReset: true } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
        <p className="mt-2 text-sm text-gray-600">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <div className="mt-1">
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="at least 6 characters"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>

          <Link
            to="/login"
            className="block text-center text-xs text-gray-500 hover:text-emerald-700"
          >
            Back to log in
          </Link>
        </form>
      </div>
    </div>
  )
}
