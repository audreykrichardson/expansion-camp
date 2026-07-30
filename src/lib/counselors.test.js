import { describe, it, expect } from 'vitest'
import { getCounselorForCamp, getCounselorCamps } from './counselors.js'

// A stand-in for the real Supabase client. It supports just enough of the
// query chain we use — .from().select().eq() then either .maybeSingle() or
// awaiting the builder directly — to answer questions about a fixed list of
// rows. No network, no database.
//
// Two terminal shapes, both matching real Supabase:
//   - .maybeSingle() → { data: row|null }, but errors if MORE than one row
//     matches (the failure mode behind slice-001).
//   - awaiting the builder → { data: rows[] } (a plain multi-row query).
function fakeSupabase(rows) {
  return {
    from() {
      const filters = {}
      const matching = () =>
        rows.filter((row) =>
          Object.entries(filters).every(([column, value]) => row[column] === value),
        )
      const builder = {
        select: () => builder,
        eq(column, value) {
          filters[column] = value
          return builder
        },
        async maybeSingle() {
          const matches = matching()
          if (matches.length > 1) {
            return {
              data: null,
              error: { code: 'PGRST116', message: 'multiple rows returned' },
            }
          }
          return { data: matches[0] ?? null, error: null }
        },
        // Makes the builder awaitable: `await supabase.from()...eq()` resolves
        // to every matching row, like a real Supabase list query.
        then(resolve, reject) {
          Promise.resolve({ data: matching(), error: null }).then(resolve, reject)
        },
      }
      return builder
    },
  }
}

// Jamie is a counselor at Roosevelt. In some tests, Jamie also counsels at a
// second camp using the same login — which is what the platform allows today.
const jamieAtRoosevelt = {
  id: 'counselor-1',
  user_id: 'jamie',
  camp_id: 'roosevelt',
  name: 'Jamie Doe',
}
const jamieAtSoccer = {
  id: 'counselor-2',
  user_id: 'jamie',
  camp_id: 'soccer',
  name: 'Jamie Doe',
}

describe('getCounselorForCamp', () => {
  it('returns the record when the user counsels at exactly one camp', async () => {
    const supabase = fakeSupabase([jamieAtRoosevelt])

    const result = await getCounselorForCamp(supabase, 'jamie', 'roosevelt')

    expect(result).toEqual(jamieAtRoosevelt)
  })

  it('returns the right record when the user counsels at two camps', async () => {
    const supabase = fakeSupabase([jamieAtRoosevelt, jamieAtSoccer])

    const result = await getCounselorForCamp(supabase, 'jamie', 'roosevelt')

    expect(result).toEqual(jamieAtRoosevelt)
  })

  it('returns null when the user is not a counselor at this camp', async () => {
    const supabase = fakeSupabase([jamieAtRoosevelt])

    const result = await getCounselorForCamp(supabase, 'jamie', 'soccer')

    expect(result).toBeNull()
  })
})

// For getCounselorCamps we care about the joined camp info (slug + name), so
// these rows carry a nested `camps` object, shaped like a real Supabase join.
const rooseveltMembership = {
  user_id: 'jamie',
  camp_id: 'roosevelt',
  camps: { slug: 'roosevelt', name: 'Roosevelt Basketball' },
}
const soccerMembership = {
  user_id: 'jamie',
  camp_id: 'soccer',
  camps: { slug: 'soccer', name: 'Soccer Stars' },
}
const someoneElsesMembership = {
  user_id: 'alex',
  camp_id: 'chess',
  camps: { slug: 'chess', name: 'Chess Club' },
}

describe('getCounselorCamps', () => {
  it('returns the one camp when the user counsels at exactly one', async () => {
    const supabase = fakeSupabase([rooseveltMembership])

    const result = await getCounselorCamps(supabase, 'jamie')

    expect(result).toEqual([{ slug: 'roosevelt', name: 'Roosevelt Basketball' }])
  })

  it('returns every camp, in a stable order, when the user counsels at two', async () => {
    // Given out of alphabetical order to prove the result is sorted, not just
    // echoed back in insertion order.
    const supabase = fakeSupabase([soccerMembership, rooseveltMembership])

    const result = await getCounselorCamps(supabase, 'jamie')

    expect(result).toEqual([
      { slug: 'roosevelt', name: 'Roosevelt Basketball' },
      { slug: 'soccer', name: 'Soccer Stars' },
    ])
  })

  it('returns an empty list when the user counsels nowhere', async () => {
    const supabase = fakeSupabase([someoneElsesMembership])

    const result = await getCounselorCamps(supabase, 'jamie')

    expect(result).toEqual([])
  })
})
