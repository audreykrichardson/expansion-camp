import { useParams, Link } from 'react-router-dom'

export default function CampAdmin() {
  const { campSlug } = useParams()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link to={`/${campSlug}`} className="text-sm text-emerald-700 hover:underline">
          &larr; Back to camp page
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {campSlug} — Admin
        </h1>
        <p className="mt-2 text-gray-600">
          Empty admin dashboard. Once a camp signs up, this is where they manage
          campers, counselors, scheduling, and payments.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {['Campers', 'Counselors', 'Payments'].map((card) => (
            <div
              key={card}
              className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-400"
            >
              {card}
              <div className="mt-1 text-2xl font-bold text-gray-300">—</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
