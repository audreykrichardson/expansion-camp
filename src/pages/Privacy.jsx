import { Link } from 'react-router-dom'

// DRAFT privacy policy — a plain-language starting point tailored to what the
// app actually does. IT IS NOT LEGAL ADVICE. Before launch: fill in every
// [BRACKETED] placeholder and have a lawyer / qualified adult review it,
// especially the children's-data section (COPPA and any state laws).
export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="text-sm text-emerald-700 hover:underline">
          &larr; Back
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: [ADD DATE BEFORE PUBLISHING]</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Who we are</h2>
            <p>
              Expansion Camp ("we," "us," or "the platform") is an online service, operated by
              [YOUR NAME OR BUSINESS/LLC], that lets camp organizers run their summer camps —
              registration, rosters, scheduling, and attendance. This policy explains what
              information we collect, how we use it, and your choices. Questions? Email us at{' '}
              <span className="font-mono">[CONTACT EMAIL]</span>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Information we collect</h2>
            <p>Depending on how you use Expansion Camp, we may collect:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Account information</strong> (camp owners and counselors): name, email
                address, password (stored in a securely hashed form), and optionally a phone
                number and role.
              </li>
              <li>
                <strong>Camper information</strong> (entered by a parent or guardian during
                registration, or by camp staff): the child's first and last name, date of
                birth, and any allergies, medical notes, or special needs the parent chooses to
                provide.
              </li>
              <li>
                <strong>Parent / guardian and emergency contact information</strong>: name,
                email address, and phone number.
              </li>
              <li>
                <strong>Camp activity</strong>: session schedules, counselor assignments, and
                attendance records.
              </li>
              <li>
                <strong>Basic technical data</strong>: standard information our hosting and
                database providers log to keep the service running securely.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">How we use information</h2>
            <p>We use the information above only to operate the service — specifically to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Register campers and maintain camp rosters.</li>
              <li>Let camp owners and their counselors manage schedules and attendance.</li>
              <li>
                Send account-related emails (for example, password resets and, where relevant,
                confirmations and invitations).
              </li>
              <li>Keep the service secure and troubleshoot problems.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell personal information, and we do not use it for
              advertising.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Children's privacy</h2>
            <p>
              Expansion Camp is designed to be used by adults (camp owners, counselors, and
              parents or guardians) — not by children. Information about a child is provided by a
              parent, guardian, or camp staff member; children do not create accounts or enter
              their own information.
            </p>
            <p>
              We take the protection of children's information seriously and only collect what a
              camp needs to run safely. A parent or guardian may request to review, correct, or
              delete their child's information at any time by contacting us at{' '}
              <span className="font-mono">[CONTACT EMAIL]</span> or by contacting their camp
              directly. [NOTE: confirm your obligations under COPPA and any state children's-
              privacy laws with a qualified professional before launch.]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">How we store and protect it</h2>
            <p>
              Data is stored with our database provider, Supabase, and is protected by
              access controls so that each camp can only see its own campers, staff, and
              records. Passwords are stored using secure one-way hashing and are never visible
              to us. Emails are sent through our email provider, Resend. No online service can
              be guaranteed 100% secure, but we work to protect your information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Who can see the information</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>A camp's owner can see the campers, counselors, and records for their camp.</li>
              <li>A counselor can see the campers and sessions assigned to them.</li>
              <li>
                Our service providers (such as Supabase for data storage and Resend for email)
                process data only to provide their services to us.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Your choices and rights</h2>
            <p>
              You may request to access, correct, or delete personal information by emailing{' '}
              <span className="font-mono">[CONTACT EMAIL]</span>. Depending on where you live,
              you may have additional rights under local law. [Confirm the specific rights you
              must offer with a professional.]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Changes to this policy</h2>
            <p>
              We may update this policy from time to time. When we do, we'll change the "Last
              updated" date above.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Contact us</h2>
            <p>
              Questions about this policy or your information? Email{' '}
              <span className="font-mono">[CONTACT EMAIL]</span>.
            </p>
          </section>
        </div>

        <p className="mt-10 border-t border-gray-100 pt-6 text-xs text-gray-400">
          This is a starting-point draft, not legal advice. Fill in every bracketed
          placeholder and have it reviewed by a qualified professional before relying on it.
        </p>
      </div>
    </div>
  )
}
