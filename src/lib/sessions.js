// Session helpers, kept out of the page components so they can be tested on
// their own.

// Given all of a camp's sessions and today's date (both session_date and today
// are 'YYYY-MM-DD' strings), return only the upcoming ones — today or later —
// sorted soonest-first (by date, then start time). Used to show a camp's
// schedule to parents on the public page.
//
export function getUpcomingSessions(sessions, today) {
  // session_date and today are 'YYYY-MM-DD' strings, so a plain string compare
  // orders dates correctly; start_time is 'HH:MM' (or null), which also string-
  // compares fine — a missing time sorts first.
  return (sessions ?? [])
    .filter((s) => s.session_date >= today)
    .sort((a, b) => {
      if (a.session_date !== b.session_date) {
        return a.session_date < b.session_date ? -1 : 1
      }
      const at = a.start_time ?? ''
      const bt = b.start_time ?? ''
      return at < bt ? -1 : at > bt ? 1 : 0
    })
}
