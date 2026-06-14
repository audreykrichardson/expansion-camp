import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.js'

// The page a counselor lands on after clicking an invite link.
// URL: /:campSlug/join/:token
export default function CounselorJoin() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState('signup') // or 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Look up what the invite is for.
  useEffect(() => {
    supabase
      .rpc('get_invite_info', { token })
      .then(({ data }) => {
        setInvite(data && data.length > 0 ? data[0] : null)
        setLoading(false)
      })
  }, [token])

  // Check whether the currently signed-in user is the camp's owner — if so,
  // they can't accept their own counselor invite (they're already the owner).
  const [isOwner, setIsOwner] = useState(false)
  useEffect(() => {
    if (!session || !invite) {
      setIsOwner(false)
      return
    }
    supabase
      .from('camps')
      .select('id')
      .eq('slug', invite.camp_slug)
      .eq('owner_user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsOwner(!!data))
  }, [session, invite])

  async function claim() {
    setError(null)
    setSubmitting(true)
    const { data, error: claimError } = await supabase.rpc('claim_counselor_invite', {
      token,
    })
    setSubmitting(false)
    if (claimError) {
      setError(claimError.message)
      return
    }
    navigate(`/${data}/counselor`, { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    const fn = mode === 'signup' ? supabase.auth.signUp : supabase.auth.signInWithPassword
    const { error: authError } = await fn.call(supabase.auth, { email, password })

    if (authError) {
      setSubmitting(false)
      setError(authError.message)
      return
    }

    // Auth succeeded — immediately claim the invite using the fresh session.
    await claim()
  }

  if (loading || authLoading) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Invite link already used</h1>
        <p className="mt-2 text-gray-600">
          This invite has already been claimed by someone. Each invite link can only be
          used once. Ask the camp owner to send you a new one.
        </p>
        <Link to="/" className="mt-6 text-emerald-700 hover:underline">Go home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-sm text-emerald-700">You've been invited to</p>
          <p className="mt-1 text-xl font-bold text-emerald-900">{invite.camp_name}</p>
          <p className="mt-1 text-sm text-emerald-700">
            as <span className="font-semibold">{invite.counselor_role}</span>
          </p>
        </div>

        {/* Three flows depending on who's looking at this page. */}
        {isOwner ? (
          // 1. The camp's owner stumbled onto their own invite link.
          <div className="mt-8 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            You're signed in as the owner of{' '}
            <span className="font-semibold">{invite.camp_name}</span>. You can't be a
            counselor at your own camp. Share this link with the person you're inviting,
            or sign out below if you want to accept the invite with a different account.
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/${invite.camp_slug}/admin`}
                className="font-semibold text-amber-700 hover:underline"
              >
                Back to admin
              </Link>
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="font-semibold text-amber-700 hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : session ? (
          // 2. Logged in as someone other than the owner — one-click accept.
          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-600">
              You're signed in as{' '}
              <span className="font-mono text-gray-900">{session.user.email}</span>. Click
              below to accept your invite.
            </p>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <button
              type="button"
              onClick={claim}
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Working…' : 'Accept invite'}
            </button>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="w-full text-center text-xs text-gray-500 hover:text-emerald-700"
            >
              Use a different account
            </button>
          </div>
        ) : (
          // 3. Not logged in — sign up or log in.
          <>
            <h1 className="mt-8 text-2xl font-bold text-gray-900">
              {mode === 'signup' ? 'Create your account' : 'Log in to accept'}
            </h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'at least 6 characters' : ''}
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
                {submitting
                  ? 'Working…'
                  : mode === 'signup'
                  ? 'Create account & accept'
                  : 'Log in & accept'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-emerald-700 hover:underline">
                    Log in instead
                  </button>
                </>
              ) : (
                <>
                  Need an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-emerald-700 hover:underline">
                    Sign up instead
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
