import { Link } from 'react-router-dom'

// DRAFT terms of service — a plain-language starting point tailored to what the
// app does. IT IS NOT LEGAL ADVICE. Before launch: fill in every [BRACKETED]
// placeholder (contact email, governing state) and have a lawyer / qualified
// adult review it.
export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="text-sm text-emerald-700 hover:underline">
          &larr; Back
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: [ADD DATE BEFORE PUBLISHING]</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">1. Agreement</h2>
            <p>
              These Terms govern your use of Expansion Camp (the "Service"), operated by
              [YOUR NAME OR BUSINESS/LLC]. By creating an account or using the Service, you agree
              to these Terms. If you don't agree, please don't use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">2. What the Service is</h2>
            <p>
              Expansion Camp is a platform that lets camp organizers run their camps —
              registration, rosters, scheduling, and attendance. Each camp is run by its own
              organizer, who is responsible for their camp and the people in it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Your account</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>You must provide accurate information and keep your password secure.</li>
              <li>You're responsible for activity that happens under your account.</li>
              <li>You must be old enough to form a binding contract to create an account.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              4. If you run a camp on the platform
            </h2>
            <p>
              As a camp organizer, you're responsible for the camp you run and for handling the
              personal information of your campers, parents, and staff lawfully — including
              getting any consents you need and following applicable laws. You agree to use the
              information only to operate your camp.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Use the Service for anything unlawful or harmful.</li>
              <li>Upload other people's personal information without permission.</li>
              <li>
                Try to break, overload, or gain unauthorized access to the Service or others'
                data.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Privacy</h2>
            <p>
              Your use of the Service is also covered by our{' '}
              <Link to="/privacy" className="text-emerald-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. The Service is provided "as is"</h2>
            <p>
              We work hard to keep Expansion Camp running, but we provide it "as is," without
              warranties of any kind. We don't guarantee it will always be available, error-free,
              or fit for a particular purpose.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">8. Limitation of liability</h2>
            <p>
              To the fullest extent allowed by law, we are not liable for indirect, incidental, or
              consequential damages arising from your use of the Service. [Have a professional
              review this section — liability terms are important and vary by location.]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">9. Ending your use</h2>
            <p>
              You can stop using the Service at any time. We may suspend or end access if these
              Terms are violated or to protect the Service or its users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">10. Changes and contact</h2>
            <p>
              We may update these Terms; we'll update the "Last updated" date when we do. These
              Terms are governed by the laws of [YOUR STATE, e.g. Washington]. Questions? Email{' '}
              <span className="font-mono">[CONTACT EMAIL]</span>.
            </p>
          </section>
        </div>

        <p className="mt-10 border-t border-gray-100 pt-6 text-xs text-gray-400">
          This is a starting-point draft, not legal advice. Fill in every bracketed placeholder
          and have it reviewed by a qualified professional before relying on it.
        </p>
      </div>
    </div>
  )
}
