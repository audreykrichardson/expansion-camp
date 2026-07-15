import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

// Click a button showing the picked date -> a calendar pops up under it.
// Click a day -> calendar closes and parent gets the ISO date (YYYY-MM-DD).
// Click outside the calendar -> closes without changing anything.
export default function DatePicker({ value, onChange, placeholder = 'Pick a date' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Close if the user clicks outside the calendar.
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selected = value ? new Date(value + 'T00:00:00') : undefined

  function handleSelect(date) {
    if (!date) {
      onChange('')
      return
    }
    // Format YYYY-MM-DD in local time (avoids UTC-offset issues that
    // toISOString() introduces).
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {selected ? (
          <span className="text-gray-900">
            {selected.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
          />
        </div>
      )}
    </div>
  )
}
