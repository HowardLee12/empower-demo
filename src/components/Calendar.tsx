'use client'

interface CalendarProps {
  selectedDate: string
  gameDates: Set<string>
  onSelectDate: (date: string) => void
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

export function Calendar({ selectedDate, gameDates, onSelectDate }: CalendarProps) {
  const [selYear, selMonth] = selectedDate.split('-').map(Number)
  const year = selYear
  const month = selMonth - 1 // 0-indexed

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const todayStr = new Date().toISOString().split('T')[0]

  // Shift to Monday-start: 0=Mon..6=Sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1)
    onSelectDate(toDateStr(d.getFullYear(), d.getMonth(), 1))
  }
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1)
    onSelectDate(toDateStr(d.getFullYear(), d.getMonth(), 1))
  }

  const weeks: (null | { day: number; dateStr: string; isCurrentMonth: boolean })[][] = []
  let currentWeek: typeof weeks[0] = []

  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const prevM = month === 0 ? 11 : month - 1
    const prevY = month === 0 ? year - 1 : year
    currentWeek.push({ day: d, dateStr: toDateStr(prevY, prevM, d), isCurrentMonth: false })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push({ day: d, dateStr: toDateStr(year, month, d), isCurrentMonth: true })
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Next month fill
  if (currentWeek.length > 0) {
    let nextD = 1
    while (currentWeek.length < 7) {
      const nextM = month === 11 ? 0 : month + 1
      const nextY = month === 11 ? year + 1 : year
      currentWeek.push({ day: nextD, dateStr: toDateStr(nextY, nextM, nextD), isCurrentMonth: false })
      nextD++
    }
    weeks.push(currentWeek)
  }

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  return (
    <div className="rounded-[12px] bg-bn-card p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-bn-slate hover:text-white text-lg px-2 transition-colors">&laquo;</button>
        <span className="text-white font-bold text-sm">
          {monthNames[month]} {year}
        </span>
        <button onClick={nextMonth} className="text-bn-slate hover:text-white text-lg px-2 transition-colors">&raquo;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d} className="text-center text-bn-slate text-xs font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0">
          {week.map((cell) => {
            if (!cell) return <div key={Math.random()} />
            const isSelected = cell.dateStr === selectedDate
            const isToday = cell.dateStr === todayStr
            const hasGame = gameDates.has(cell.dateStr)

            return (
              <button
                key={cell.dateStr}
                onClick={() => onSelectDate(cell.dateStr)}
                className={`relative text-center py-2 text-sm transition-all rounded-[6px] ${
                  !cell.isCurrentMonth
                    ? 'text-bn-steel/40'
                    : isSelected
                      ? 'bg-bn-yellow text-bn-ink font-bold'
                      : isToday
                        ? 'bg-bn-yellow/20 text-bn-yellow font-semibold'
                        : hasGame
                          ? 'text-bn-yellow font-semibold hover:bg-white/[0.06]'
                          : 'text-bn-slate hover:bg-white/[0.04]'
                }`}
              >
                {cell.day}
                {hasGame && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-bn-yellow" />
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
