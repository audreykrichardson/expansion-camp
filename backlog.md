# Backlog

## In Progress
<!-- The single slice currently being worked on -->
(none)

## Planned
<!-- Slices declared but not started -->
- [slice-004] Owners with 2+ camps hit the same Login.jsx `.limit(1)` arbitrariness — apply
  the same deterministic/picker treatment to the owner branch

## Done
<!-- Completed slices, newest at top -->
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
- [bug-001] npm audit reports 4 pre-existing vulnerabilities (vite, react-router,
  @babel/core) — predates R/G/R setup; needs `npm audit fix` plus a regression check
- [chore-001] Throwaway test data from verifying slices 001/003 is still in Supabase: two
  "Test Counselor" rows (Test Camp + Demo Camp) for `testcounselor@gmail.com`, and its Auth
  user. It now works as a handy 2-camp picker test fixture — keep it, or delete via the
  Supabase dashboard (Table editor + Auth) when done.
