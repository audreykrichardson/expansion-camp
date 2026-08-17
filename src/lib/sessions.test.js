import { describe, it, expect } from 'vitest'
import { getUpcomingSessions } from './sessions.js'

// Tiny helper to build a session row with just the fields this function cares
// about. `today` is passed in explicitly (not read from the clock) so these
// tests are deterministic no matter what day they run.
const session = (id, date, time) => ({
  id,
  session_date: date,
  start_time: time,
  title: `Session ${id}`,
})

describe('getUpcomingSessions', () => {
  it('drops sessions dated before today', () => {
    const result = getUpcomingSessions(
      [session(1, '2026-08-01', '09:00'), session(2, '2026-08-20', '09:00')],
      '2026-08-10',
    )
    expect(result.map((s) => s.id)).toEqual([2])
  })

  it("keeps sessions dated today", () => {
    const result = getUpcomingSessions([session(1, '2026-08-10', '09:00')], '2026-08-10')
    expect(result.map((s) => s.id)).toEqual([1])
  })

  it('sorts by date, then start time, soonest first', () => {
    const result = getUpcomingSessions(
      [
        session(1, '2026-08-20', '09:00'),
        session(2, '2026-08-12', '14:00'),
        session(3, '2026-08-12', '09:00'),
      ],
      '2026-08-01',
    )
    expect(result.map((s) => s.id)).toEqual([3, 2, 1])
  })

  it('returns an empty list when there are no sessions', () => {
    expect(getUpcomingSessions([], '2026-08-10')).toEqual([])
  })

  it('excludes sessions the owner marked not public (is_public false)', () => {
    const result = getUpcomingSessions(
      [
        { ...session(1, '2026-08-20', '09:00'), is_public: false },
        { ...session(2, '2026-08-20', '10:00'), is_public: true },
      ],
      '2026-08-01',
    )
    expect(result.map((s) => s.id)).toEqual([2])
  })

  it('includes sessions with no is_public set (back-compat before the column exists)', () => {
    const result = getUpcomingSessions([session(1, '2026-08-20', '09:00')], '2026-08-01')
    expect(result.map((s) => s.id)).toEqual([1])
  })
})
