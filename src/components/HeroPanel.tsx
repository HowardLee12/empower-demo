'use client'

interface HeroPanelProps {
  readonly liveCount: number
  readonly upcomingCount: number
  readonly teamCount: number
}

export function HeroPanel({ liveCount, upcomingCount, teamCount }: HeroPanelProps) {
  return (
    <div className="bg-bn-ink rounded-[20px] p-8 sm:p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[340px]">
      {/* Glow */}
      <div className="absolute right-[-120px] bottom-[-120px] w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(240,185,11,0.25)_0%,transparent_70%)]" />

      {/* Eyebrow */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide bg-bn-yellow/15 text-bn-yellow px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-bn-yellow animate-pulse" />
          EMPOWER 賽事中心
        </div>
      </div>

      {/* Title */}
      <div className="relative z-10 mt-6">
        <h1 className="text-[clamp(28px,4vw,44px)] font-semibold leading-[1.05] tracking-tight">
          賽事一覽<span className="text-bn-yellow">.</span>
        </h1>
        <p className="text-white/65 text-[15px] leading-relaxed mt-4 max-w-[440px]">
          EMPOWER 青少年籃球俱樂部賽事平台。查看即時比分、賽程安排與球員數據。
        </p>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex gap-12 mt-8 pt-6 border-t border-white/10">
        <div>
          <div className={`text-[32px] font-semibold tracking-tight tabular-nums ${liveCount > 0 ? 'text-bn-yellow' : ''}`}>
            {String(liveCount).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/55 font-medium mt-1">進行中</div>
        </div>
        <div>
          <div className="text-[32px] font-semibold tracking-tight tabular-nums">
            {String(upcomingCount).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/55 font-medium mt-1">即將開始</div>
        </div>
        <div>
          <div className="text-[32px] font-semibold tracking-tight tabular-nums">
            {String(teamCount).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/55 font-medium mt-1">參賽隊伍</div>
        </div>
      </div>
    </div>
  )
}
