'use client'

import { TeamEmblem } from './TeamEmblem'
import type { StandingRow } from '@/lib/standings'

interface StandingsTableProps {
  readonly rows: readonly StandingRow[]
  readonly title?: string
}

export function StandingsTable({ rows, title = '排名' }: StandingsTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="bg-white border border-bn-border rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[32px_1fr_50px_70px_70px_90px] items-center gap-3 px-5 py-3.5 bg-[#FAFAF7] border-b border-bn-border text-[11px] font-semibold text-bn-slate tracking-wider uppercase">
        <span>#</span>
        <span>{title}</span>
        <span>GP</span>
        <span>W–L</span>
        <span>PPG</span>
        <span>近5場</span>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const ppg = row.gamesPlayed > 0
          ? (row.pointsFor / row.gamesPlayed).toFixed(1)
          : '0.0'
        const isTop3 = i < 3

        return (
          <div
            key={row.squadId}
            className="grid grid-cols-[32px_1fr_50px_70px_70px_90px] items-center gap-3 px-5 py-3.5 border-b border-bn-border/50 last:border-b-0 hover:bg-[#FAFAF7] transition-colors text-sm cursor-pointer"
          >
            {/* Rank */}
            <span className="font-semibold tabular-nums text-[13px] text-bn-slate flex items-center gap-2">
              {isTop3 && <span className="w-1 h-[18px] bg-bn-yellow rounded-sm" />}
              {i + 1}
            </span>

            {/* Team */}
            <div className="flex items-center gap-3 min-w-0">
              <TeamEmblem shortName={row.orgShortName} size="sm" />
              <span className="font-semibold tracking-tight truncate">{row.squadName}</span>
            </div>

            {/* GP */}
            <span className="tabular-nums text-bn-slate font-medium">{row.gamesPlayed}</span>

            {/* W-L */}
            <span className="tabular-nums font-semibold text-bn-ink">{row.wins}–{row.losses}</span>

            {/* PPG */}
            <span className="tabular-nums font-semibold text-bn-ink">{ppg}</span>

            {/* Last 5 */}
            <div className="flex gap-1">
              {row.lastFive.map((r, j) => (
                <span
                  key={j}
                  className={`w-[18px] h-[18px] rounded-[6px] grid place-items-center text-[9px] font-bold text-white ${
                    r === 'W' ? 'bg-bn-green' : 'bg-bn-red'
                  }`}
                >
                  {r}
                </span>
              ))}
              {/* Fill empty slots */}
              {Array.from({ length: Math.max(0, 5 - row.lastFive.length) }).map((_, j) => (
                <span
                  key={`empty-${j}`}
                  className="w-[18px] h-[18px] rounded-[6px] bg-bn-border/30"
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
