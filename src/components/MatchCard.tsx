'use client'

import Link from 'next/link'
import { TeamEmblem } from './TeamEmblem'
import { isActuallyLive } from '@/lib/game-status'

interface MatchCardProps {
  readonly game: {
    readonly id: string
    readonly home_squad_name: string
    readonly away_squad_name: string
    readonly home_score: number
    readonly away_score: number
    readonly game_time: string | null
    readonly location: string
    readonly status: string
    readonly season_id?: string | null
  }
  readonly leagueName?: string
  readonly leagueDot?: string
  readonly homeOrg?: { readonly short_name: string; readonly logo_url?: string }
  readonly awayOrg?: { readonly short_name: string; readonly logo_url?: string }
}

export function MatchCard({ game, leagueName, leagueDot, homeOrg, awayOrg }: MatchCardProps) {
  const isCompleted = game.status === 'completed'
  const isLive = isActuallyLive(game)
  const homeWin = isCompleted && game.home_score > game.away_score
  const awayWin = isCompleted && game.away_score > game.home_score
  const displayTime = game.game_time?.substring(0, 5)

  const card = (
    <div
      className={`grid items-center gap-4 px-5 py-4 bg-white border rounded-[12px] cursor-pointer transition-all relative
        ${isLive
          ? 'border-bn-red/50 shadow-[0_0_0_4px_rgba(246,70,93,0.06)]'
          : 'border-bn-border hover:border-bn-dark/20 hover:-translate-y-[1px] hover:shadow-[0_1px_2px_rgba(15,17,21,0.04),0_4px_14px_-8px_rgba(15,17,21,0.10)]'
        }
        grid-cols-[90px_1fr_120px_1fr_36px]
        lg:grid-cols-[110px_1fr_130px_1fr_160px_36px]
      `}
    >
      {/* Time + League badge */}
      <div className="flex flex-col gap-1">
        {isCompleted && (
          <div className="text-bn-slate text-[18px] font-semibold tabular-nums tracking-tight">FT</div>
        )}
        {isLive && (
          <div className="text-bn-red text-sm font-semibold">● LIVE</div>
        )}
        {!isCompleted && !isLive && displayTime && (
          <div className="text-bn-ink text-[18px] font-semibold tabular-nums tracking-tight">{displayTime}</div>
        )}
        {leagueName && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-bn-slate">
            {leagueDot && (
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: leagueDot }} />
            )}
            <span className="truncate">{leagueName}</span>
          </div>
        )}
      </div>

      {/* Home team */}
      <div className="flex items-center gap-3 min-w-0">
        <TeamEmblem
          logoUrl={homeOrg?.logo_url}
          shortName={homeOrg?.short_name ?? game.home_squad_name.slice(0, 2)}
        />
        <div className="min-w-0 flex-1">
          <div className={`text-[15px] font-semibold tracking-tight truncate ${isCompleted && !homeWin ? 'text-bn-slate' : 'text-bn-ink'}`}>
            {game.home_squad_name}
          </div>
        </div>
      </div>

      {/* Score / VS */}
      <div className="text-center tabular-nums">
        {isCompleted || isLive ? (
          <div className="inline-flex items-baseline gap-2.5 text-[22px] font-semibold tracking-tight">
            <span className={homeWin ? 'text-bn-ink' : isLive && game.home_score > game.away_score ? 'text-bn-red' : 'text-bn-slate'}>
              {game.home_score}
            </span>
            <span className="text-sm text-bn-border font-normal">–</span>
            <span className={awayWin ? 'text-bn-ink' : isLive && game.away_score > game.home_score ? 'text-bn-red' : 'text-bn-slate'}>
              {game.away_score}
            </span>
          </div>
        ) : (
          <div className="text-[13px] text-bn-slate font-medium tracking-widest">VS</div>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-3 min-w-0 justify-end">
        <div className="min-w-0 flex-1 text-right">
          <div className={`text-[15px] font-semibold tracking-tight truncate ${isCompleted && !awayWin ? 'text-bn-slate' : 'text-bn-ink'}`}>
            {game.away_squad_name}
          </div>
        </div>
        <TeamEmblem
          logoUrl={awayOrg?.logo_url}
          shortName={awayOrg?.short_name ?? game.away_squad_name.slice(0, 2)}
        />
      </div>

      {/* Venue — hidden on mobile */}
      <div className="hidden lg:flex flex-col gap-0.5">
        <div className="text-[10px] text-bn-slate font-semibold tracking-wider uppercase">Venue</div>
        <div className="text-[13px] text-bn-ink font-medium truncate">{game.location || '—'}</div>
      </div>

      {/* CTA arrow */}
      <div className="w-9 h-9 rounded-full bg-bn-snow grid place-items-center text-bn-slate group-hover:bg-bn-ink group-hover:text-white transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  )

  if (isCompleted) {
    return <Link href={`/games/${game.id}`} className="block group">{card}</Link>
  }
  return <div className="group">{card}</div>
}
