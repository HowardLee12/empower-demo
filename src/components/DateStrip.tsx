'use client'

interface DateStripProps {
  selectedDate: string
  gameDates: Set<string>
  onSelectDate: (date: string) => void
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function DateStrip({ selectedDate, gameDates, onSelectDate }: DateStripProps) {
  const selected = new Date(selectedDate + 'T00:00:00')
  const today = new Date()
  const todayStr = toDateStr(today)

  // Build 7 days centered around selected date
  const days: Date[] = []
  for (let i = -3; i <= 3; i++) {
    const d = new Date(selected)
    d.setDate(d.getDate() + i)
    days.push(d)
  }

  const shift = (offset: number) => {
    const d = new Date(selected)
    d.setDate(d.getDate() + offset)
    onSelectDate(toDateStr(d))
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => shift(-7)}
        className="w-8 h-10 flex items-center justify-center text-bn-slate hover:text-bn-ink transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex gap-1 flex-1 justify-center">
        {days.map((d) => {
          const dateStr = toDateStr(d)
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr
          const hasGame = gameDates.has(dateStr)
          const month = d.getMonth() + 1
          const day = d.getDate()
          const weekday = WEEKDAYS[d.getDay()]

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center px-3 py-2 rounded-[8px] min-w-[52px] transition-all ${
                isSelected
                  ? 'bg-bn-yellow text-bn-ink'
                  : isToday
                    ? 'bg-bn-yellow/10 text-bn-yellow'
                    : 'hover:bg-bn-snow text-bn-secondary'
              }`}
            >
              <span className={`text-[10px] font-medium ${isSelected ? 'text-bn-ink/60' : 'text-bn-slate'}`}>
                {weekday}
              </span>
              <span className="text-lg font-bold tabular-nums leading-tight">
                {day}
              </span>
              <span className={`text-[10px] ${isSelected ? 'text-bn-ink/50' : 'text-bn-slate'}`}>
                {month}月
              </span>
              {hasGame && !isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-bn-yellow mt-0.5" />
              )}
              {hasGame && isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-bn-ink/30 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => shift(7)}
        className="w-8 h-10 flex items-center justify-center text-bn-slate hover:text-bn-ink transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
