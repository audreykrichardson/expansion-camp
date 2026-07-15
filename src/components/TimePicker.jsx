// Three dropdowns — hour (1-12), minute (15-min increments), AM/PM.
// Value is a HH:MM string in 24-hour time; parent gets '' when incomplete.
export default function TimePicker({ value, onChange }) {
  // Parse the incoming HH:MM into 12h + minute + period, or blanks.
  let hour12 = ''
  let minute = ''
  let period = 'AM'
  if (value) {
    const [hStr, mStr] = value.split(':')
    const h24 = Number(hStr)
    period = h24 >= 12 ? 'PM' : 'AM'
    const h12raw = h24 % 12
    hour12 = String(h12raw === 0 ? 12 : h12raw)
    minute = mStr
  }

  function update(nextHour, nextMinute, nextPeriod) {
    if (!nextHour || !nextMinute) {
      onChange('')
      return
    }
    let h24 = Number(nextHour) % 12
    if (nextPeriod === 'PM') h24 += 12
    onChange(`${String(h24).padStart(2, '0')}:${nextMinute}`)
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1))
  // Every 5 minutes: 00, 05, 10, ..., 55
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  return (
    <div className="flex items-center gap-2">
      <select
        value={hour12}
        onChange={(e) => update(e.target.value, minute, period)}
        className={selectClass}
      >
        <option value="">Hr</option>
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-gray-400">:</span>
      <select
        value={minute}
        onChange={(e) => update(hour12, e.target.value, period)}
        className={selectClass}
      >
        <option value="">Min</option>
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => update(hour12, minute, e.target.value)}
        className={selectClass}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
