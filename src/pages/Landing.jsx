import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-emerald-700">Expansion Camp</span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-700 hover:text-emerald-700"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Start your camp
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Run your summer camp online — for free.
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          Registration, parent and counselor dashboards, scheduling, and payments.
          No setup costs, no subscriptions. You only pay a small percentage when
          parents sign up.
        </p>
        <div className="mt-10">
          <Link
            to="/signup"
            className="rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700"
          >
            Start your camp — it&apos;s free
          </Link>
        </div>
      </main>
    </div>
  )
}
