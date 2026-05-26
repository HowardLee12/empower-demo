'use client'

import Link from 'next/link'
import { TeamEmblem } from './TeamEmblem'
import type { StatLeader } from '@/lib/stat-leaders'

interface StatLeadersProps {
  readonly leaders: readonly StatLeader[]
}

export function StatLeaders({ leaders }: StatLeadersProps) {
  if (leaders.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {leaders.map((l) => (
        <Link
          key={l.category}
          href={`/players/${l.playerId}`}
          className="bg-white border border-bn-border rounded-[16px] px-5 py-4 grid grid-cols-[1fr_auto] items-center gap-4 cursor-pointer hover:border-bn-dark/20 hover:-translate-y-[1px] transition-all"
        >
          {/* Info */}
          <div>
            <div className="text-[11px] font-semibold text-bn-slate tracking-wider uppercase">
              {l.category}
            </div>
            <div className="text-[18px] font-semibold tracking-tight mt-1 text-bn-ink">
              {l.playerName || '—'}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-bn-slate">
              <TeamEmblem logoUrl={l.orgLogoUrl} shortName={l.orgShortName} size="sm" />
              <span>{l.teamName}{l.playerNumber ? ` · #${l.playerNumber}` : ''}</span>
            </div>
          </div>

          {/* Value */}
          <div className="text-right tabular-nums">
            <div className="text-[36px] font-semibold tracking-tighter leading-none text-bn-ink">
              {l.value}
            </div>
            <div className="text-[11px] text-bn-slate font-medium mt-1">
              {l.unit}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
