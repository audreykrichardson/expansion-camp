// Counselor lookups, pulled out of the page components so they can be tested
// on their own. The pages care about rendering; this file cares about "which
// counselor record are we talking about?"

// Find the counselor record for a signed-in user at a particular camp.
//
// Returns the counselor row, or null if this user isn't a counselor there.
//
// Both filters matter. Matching on user_id alone was the slice-001 bug: a
// person who counsels at two camps has two rows, so maybeSingle() errored and
// their dashboard broke — and someone visiting the wrong camp's page got a
// record back that didn't belong to that camp. Scoping to camp_id too means
// there is at most one matching row, which is exactly what maybeSingle() wants.
export async function getCounselorForCamp(supabase, userId, campId) {
  const { data } = await supabase
    .from('counselors')
    .select('*')
    .eq('user_id', userId)
    .eq('camp_id', campId)
    .maybeSingle()

  return data ?? null
}

// List every camp where this user is a counselor, as { slug, name } entries.
// Used after login to decide where to send a counselor: zero camps → home,
// one → straight to that dashboard, two or more → a pick-your-camp screen.
//
export async function getCounselorCamps(supabase, userId) {
  const { data } = await supabase
    .from('counselors')
    .select('camp_id, camps(slug, name)')
    .eq('user_id', userId)

  // Each row carries its joined camp under `camps`. Pull those out, drop any
  // row whose camp didn't join (defensive), and sort by name so the list is
  // stable every time — important once it drives a pick-your-camp screen.
  return (data ?? [])
    .map((row) => row.camps)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
}
