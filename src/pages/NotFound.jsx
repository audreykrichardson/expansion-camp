import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center">
      <h1 className="text-5xl font-extrabold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">We couldn&apos;t find that page.</p>
      <Link to="/" className="mt-6 text-emerald-700 hover:underline">
        Go home
      </Link>
    </div>
  )
}
