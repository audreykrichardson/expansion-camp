import { Link } from 'react-router-dom'

export default function Signup() {
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

        {/* Placeholder form — not wired up yet. Phase 2 connects this to Supabase. */}
        <form className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Camp name</label>
            <input
              type="text"
              placeholder="Roosevelt Basketball Day Camp"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Your email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            Create camp
          </button>
        </form>
      </div>
    </div>
  )
}
