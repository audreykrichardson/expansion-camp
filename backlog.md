# Backlog

## In Progress
<!-- The single slice currently being worked on -->
(none)

## Planned
- [slice-011] Payments Stage 1 — backend + Stripe test-mode wiring — **PAUSED: doing payments
  with Derek** (his infra wheelhouse; not started). When resumed: add first backend (Netlify
  functions; netlify-cli 24 installed, test via `netlify dev`), adapt roosevelt-camp's
  create-payment-intent pattern, use a SEPARATE Stripe account (test mode), keep the secret
  key out of client code/git. See memory "expansion-camp-payments-direction".
<!-- Slices declared but not started -->
- [slice-007] Verify a real sending domain in Resend so auth/reset emails can go to ANY
  address (not just Audrey's Gmail), then swap the Supabase sender from
  onboarding@resend.dev → noreply@<yourdomain>, and add the production redirect URL in
  Supabase URL Configuration. Needed before real users can reset passwords. Ties to picking
  the app's domain.
- [slice-future] SMS / phone password-reset option (Audrey requested 2026-07-30). Big lift,
  not a quick add — needs: collecting + verifying phone numbers on accounts, an SMS provider
  (e.g. Twilio, per-text cost), and Supabase phone-auth config. Email reset already covers
  the core need; revisit post-launch. See discussion in slice-005 notes.
- [slice-004] Owners with 2+ camps hit the same Login.jsx `.limit(1)` arbitrariness — apply
  the same deterministic/picker treatment to the owner branch

## Done
<!-- Completed slices, newest at top -->
- [slice-012] Show a camp's upcoming schedule on its public page ✅ Done 2026-08-XX
  - getUpcomingSessions(sessions, today) in src/lib/sessions.js (filter past + sort by date
    then start_time), 4 tests (test-first, R/G/R). CampHome.jsx renders a Schedule section.
  - Manual Supabase change applied: added a public SELECT policy "anyone can view sessions"
    on the sessions table (for select, to public, using true) so anon visitors can read the
    schedule. Updated the RLS-audit memory to reflect sessions is now public-read.
  - VERIFIED END-TO-END: added a session as owner → it appeared on the logged-out public page.
- [slice-010] React Router v6→v7 upgrade ✅ Done 2026-08-XX — clears the last 2 npm-audit
  vulnerabilities (open-redirect advisories) + patched a transitive nanoid high. Now
  **0 vulnerabilities** (was 5). App code needed zero changes; verified 6/6 tests, clean
  build, and routing (direct render + client-side link nav, no console errors). Fully
  resolves bug-001 and sec-note-3.
- [slice-008] Privacy Policy + Terms pages ✅ Done 2026-08-XX (DRAFT content)
  - New src/pages/Privacy.jsx + Terms.jsx, routes /privacy + /terms in App.jsx, footer links
    on Landing.jsx. Plain-language drafts tailored to what the app collects (camper data via
    parents, Supabase storage, multi-tenant, children's-privacy section).
  - ⚠️ NOT legal advice / NOT launch-ready as written. Before launch: fill every [BRACKETED]
    placeholder (operator name, [CONTACT EMAIL], [YOUR STATE], effective date) and have a
    lawyer / qualified adult review — especially the children's-data/COPPA section.
  - Signup page now has a "By creating your camp, you agree to our Terms & Privacy Policy"
    line with links (done 2026-08).
  - Follow-up (slice-009): fill every placeholder + get a legal/adult review before launch.
- [slice-006] Email delivery via Resend → Supabase SMTP ✅ Done 2026-08-05
  - Made a Resend account (Audrey's own; Roosevelt's wasn't accessible), created an API key,
    configured Supabase custom SMTP: host smtp.resend.com, port 465, user "resend", pass =
    Resend API key, sender onboarding@resend.dev, sender name "Expansion Camp". Added
    http://localhost:5173/** to Supabase Auth → URL Configuration → Redirect URLs.
  - VERIFIED END-TO-END: created a Supabase user for audrey.k.richardson@gmail.com, requested
    a reset, the email actually arrived, clicked the link → /reset-password → set new password
    → logged in with it. Password reset fully works.
  - Config only (no repo code change). Test sender onboarding@resend.dev only delivers to
    Audrey's own Gmail until a domain is verified → that + prod redirect URL is slice-007.
  - Cleanup someday: the audrey.k.richardson@gmail.com test user + the fake @test.com accounts.
- [slice-005] Password reset flow ✅ Done 2026-07-30 (code)
  - ForgotPassword.jsx + ResetPassword.jsx, routes in App.jsx, "Forgot your password?" link
    + "Password updated" banner in Login.jsx. Flow: forgot → resetPasswordForEmail → emailed
    link → /reset-password → updateUser → signOut → /login.
  - Verified: pages render, no console errors, tests 6/6 + build clean; Part A (link →
    forgot page → "check your email") confirmed by Audrey. Full email round-trip deferred to
    slice-006 (needs Supabase redirect URLs + real email provider).
- [slice-003] Pick-your-camp screen + Login wiring (bug-002) ✅ Done 2026-07-29
  - Login.jsx: 0 counselor camps → home, 1 → that dashboard, 2+ → inline "Choose a camp"
    picker (campChoices state); each camp → /:slug/counselor. Scope: counselor camps only.
  - Verified END-TO-END: a real two-camp counselor logged in and got the picker, then
    clicking a camp opened that dashboard. `npm test` 6/6 green, `npm run build` clean.
- [schema-001] Investigated — **NOT NEEDED**. Believed there was a UNIQUE rule on
  counselors.user_id forcing one-camp-per-counselor; direct schema inspection found none
  (no such constraint or index). The real blocker was test data: the Demo Camp counselor
  row had `user_id = NULL`. Setting it to the counselor's real auth UID made the picker
  work. See memory "expansion-camp-counselor-one-camp-constraint".
- [slice-002] getCounselorCamps helper — lists all camps a user counsels at ✅ Done 2026-07-27
  - src/lib/counselors.js: joins camps, returns [{slug, name}] sorted by name
  - 3 tests (one camp / two camps / none), all green; extended the fake Supabase to
    support awaited list queries alongside maybeSingle
- [slice-001] Counselor lookup must match the camp in the URL, not just the logged-in user
  ✅ Done 2026-07-27
  - Extracted getCounselorForCamp into src/lib/counselors.js and scoped the query to
    (user_id, camp_id); wired CounselorDashboard.jsx and CounselorSessionAttendance.jsx to it
  - 3 tests in src/lib/counselors.test.js, all green; `npm run build` passes

## Discovered (needs triage)
<!-- Bugs/features found mid-slice; do not start these until the current slice is done -->
- [sec-audit] RLS security audit 2026-07-30 — **PASSED**. All 5 tables (campers, counselors,
  attendance, sessions, camps) have RLS on with policies properly scoped to owner and/or
  assigned counselor via auth.uid(). A logged-out user can't read campers, counselor PII,
  invite tokens, or attendance. camps is public-read by design; no camp-hijack (UPDATE
  with_check pins owner_user_id). Minor follow-ups below.
- [sec-note-1] Public camps SELECT (`qual: true`) also exposes internal `owner_user_id` —
  harmless but untidy; consider a view or column-level restriction later.
- [sec-note-2] No DELETE policy on campers or camps — safe default, but owners can't delete
  either through the app; add owner-scoped delete if that becomes a needed feature.
- [bug-001] npm audit — PARTLY DONE 2026-07-30. `npm audit fix` (safe, in-range) cleared 3
  of 5, incl. both HIGH (Vite dev-server, dev/Windows-only) and the low one; lockfile-only
  change, verified via tests+build+manual login. 2 MODERATE remain → see sec-note-3.
- [sec-note-3] React Router v6→v7 upgrade needed to clear the 2 remaining moderate
  open-redirect advisories (GHSA-2j2x-hqr9-3h42, GHSA-wrjc-x8rr-h8h6). Major version =
  breaking API changes across all routing; do as its own careful migration + full retest,
  not a quick fix. Relevant (runtime), do before public launch.
- [ux-note-1] TimePicker defaults the AM/PM dropdown to AM, so users easily save a PM time as
  AM by mistake (seen 2026-08: a session's end time saved as 3:15 AM). Consider defaulting the
  period from the hour, or making AM/PM more prominent. src/components/TimePicker.jsx.
- [chore-001] Throwaway test data from verifying slices 001/003 is still in Supabase: two
  "Test Counselor" rows (Test Camp + Demo Camp) for `testcounselor@gmail.com`, and its Auth
  user. It now works as a handy 2-camp picker test fixture — keep it, or delete via the
  Supabase dashboard (Table editor + Auth) when done.
