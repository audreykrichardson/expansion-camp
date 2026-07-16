import { useEffect, useState } from 'react'

// Three dropdowns — hour (1-12), minute (5-min increments), AM/PM.
// Value is a HH:MM string in 24-hour time; parent gets '' when incomplete.
//
// Uses local state so partial picks stay visible while the user is still
// filling things in. If the user picks Hour = 9 without a minute, we
// remember that and just don't emit a value up yet.
function parse(value) {
  if (!value) return { hour12: '', minute: '', period: 'AM' }
  const [hStr, mStr] = value.split(':')
  const h24 = Number(hStr)
  const h12raw = h24 % 12
  return {
    hour12: String(h12raw === 0 ? 12 : h12raw),
    minute: mStr,
    period: h24 >= 12 ? 'PM' : 'AM',
  }
}

export default function TimePicker({ value, onChange }) {
  const [state, setState] = useState(() => parse(value))

  // Sync from parent value when it changes externally (form reset, editing).
  useEffect(() => {
    setState(parse(value))
  }, [value])

  function update(patch) {
    const next = { ...state, ...patch }
    setState(next)
    // Emit up only when we have both parts.
    if (next.hour12 && next.minute) {
      let h24 = Number(next.hour12) % 12
      if (next.period === 'PM') h24 += 12
      onChange(`${String(h24).padStart(2, '0')}:${next.minute}`)
    } else {
      onChange('')
    }
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1))
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  return (
    <div className="flex items-center gap-2">
      <select
        value={state.hour12}
        onChange={(e) => update({ hour12: e.target.value })}
        className={selectClass}
      >
        <option value="">Hr</option>
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-gray-400">:</span>
      <select
        value={state.minute}
        onChange={(e) => update({ minute: e.target.value })}
        className={selectClass}
      >
        <option value="">Min</option>
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={state.period}
        onChange={(e) => update({ period: e.target.value })}
        className={selectClass}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
