import { useParams, Link } from 'react-router-dom'

export default function CampHome() {
  const { campSlug } = useParams()

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-sm uppercase tracking-wide text-emerald-600">
          Camp page
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
          Welcome to {campSlug}
        </h1>
        <p className="mt-4 text-gray-600">
          This is the public home page for the camp with slug{' '}
          <span className="font-mono font-semibold">{campSlug}</span>. Phase 3
          turns this into the real registration page.
        </p>
        <Link
          to={`/${campSlug}/admin`}
          className="mt-8 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
        >
          Go to admin dashboard
        </Link>
      </div>
    </div>
  )
}
