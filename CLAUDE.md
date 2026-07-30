mode: production
workflow: R/G/R
test_command: npm test

## Project context
<!-- Durable notes about how this project is built. Update deliberately, not every slice. -->
- Language/framework: JavaScript, no TypeScript — React 18 + Vite 6 + React Router 6
- Test framework: Vitest 4. `npm test` runs once; `npm run test:watch` re-runs on save
- Backend: Supabase (auth, Postgres, storage). Schema, RLS policies, and RPCs live ONLY
  in the Supabase dashboard — there are no migrations in this repo, so never assume a
  column exists and flag schema changes as manual steps
- Key directories: src/pages/ (one file per route), src/components/ (Modal, DatePicker,
  TimePicker, PasswordInput), src/lib/ (shared Supabase client, useAuth hook)
- Multi-tenancy: every camp is a URL slug — /:campSlug, /:campSlug/admin/*,
  /:campSlug/counselor. One app serves all camps
- Conventions: one shared Supabase client from src/lib/supabase.js (never call
  createClient elsewhere); admin pages check owner_user_id, then redirect counselors to
  their dashboard and everyone else home; staged loading (authLoading → Navigate to
  /login → page loading → content); effects use a `cancelled` flag; empty form strings
  coerced to null on write; Postgres error 23505 caught by hand for friendly duplicate
  messages; optimistic UI always reverts and surfaces the error on failure
- Known duplication: the admin ownership check is copy-pasted across 6 admin pages, and
  formatPhone across 4 — prefer extracting into src/lib/ when a slice touches them
- Deploy: Netlify. netlify.toml holds the SPA fallback redirect. Dev is plain
  `npm run dev` on :5173 — this project has no Netlify functions
- Styling: Tailwind 3 utilities inline. Brand default emerald #059669, overridden per
  camp by primary_color
