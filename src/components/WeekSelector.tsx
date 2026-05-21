'use client'

interface WeekSelectorProps {
  readonly weekOffset: number
  readonly onChangeWeek: (offset: number) => void
}

export function WeekSelector({ weekOffset, onChangeWeek }: WeekSelectorProps) {
  const options = [
    { offset: -1, label: '上週' },
    { offset: 0, label: '本週' },
    { offset: 1, label: '下週' },
  ] as const

  return (
    <div className="flex gap-1 bg-white border border-bn-border p-1 rounded-full">
      {options.map(({ offset, label }) => (
        <button
          key={offset}
          onClick={() => onChangeWeek(offset)}
          className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all ${
            weekOffset === offset
              ? 'bg-bn-yellow text-bn-ink font-semibold'
              : 'text-bn-slate hover:text-bn-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
