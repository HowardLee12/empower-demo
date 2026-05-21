'use client'

type StatusFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FINAL'

interface StatusChipsProps {
  readonly value: StatusFilter
  readonly onChange: (v: StatusFilter) => void
  readonly counts: {
    readonly all: number
    readonly live: number
    readonly upcoming: number
    readonly final: number
  }
}

const CHIPS: readonly { readonly key: StatusFilter; readonly label: string; readonly dot: string | null }[] = [
  { key: 'ALL', label: '全部', dot: null },
  { key: 'LIVE', label: '進行中', dot: '#F6465D' },
  { key: 'UPCOMING', label: '即將開始', dot: '#0EA5E9' },
  { key: 'FINAL', label: '已結束', dot: '#848E9C' },
]

export function StatusChips({ value, onChange, counts }: StatusChipsProps) {
  const countMap: Record<StatusFilter, number> = {
    ALL: counts.all,
    LIVE: counts.live,
    UPCOMING: counts.upcoming,
    FINAL: counts.final,
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {CHIPS.map(({ key, label, dot }) => {
        const isActive = value === key
        const count = countMap[key]
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-3.5 py-2 text-xs font-medium rounded-full border transition-all inline-flex items-center gap-1.5 ${
              isActive
                ? 'bg-bn-ink text-white border-bn-ink'
                : 'bg-white text-bn-slate border-bn-border hover:text-bn-ink'
            }`}
          >
            {dot && (
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: dot }} />
            )}
            {label}
            {count > 0 && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                isActive ? 'bg-white/15 text-white' : 'bg-black/5 text-bn-slate'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export type { StatusFilter }
