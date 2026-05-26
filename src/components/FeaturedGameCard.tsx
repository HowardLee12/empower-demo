'use client'

import { TeamEmblem } from './TeamEmblem'
import { isActuallyLive } from '@/lib/game-status'

interface FeaturedGame {
  readonly id: string
  readonly home_squad_name: string
  readonly away_squad_name: string
  readonly home_score: number
  readonly away_score: number
  readonly game_time: string | null
  readonly location: string
  readonly status: string
}

interface FeaturedGameCardProps {
  readonly game: FeaturedGame
  readonly leagueName?: string
  readonly leagueDot?: string
  readonly homeOrg?: { readonly short_name: string; readonly logo_url?: string }
  readonly awayOrg?: { readonly short_name: string; readonly logo_url?: string }
}

export function FeaturedGameCard({ game, leagueName, leagueDot, homeOrg, awayOrg }: FeaturedGameCardProps) {
  const isLive = isActuallyLive(game)
  const isCompleted = game.status === 'completed'
  const displayTime = game.game_time?.substring(0, 5)
  const homeWin = isCompleted && game.home_score > game.away_score
  const awayWin = isCompleted && game.away_score > game.home_score

  return (
    <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,17,21,0.04),0_4px_14px_-8px_rgba(15,17,21,0.10)] border border-bn-border flex flex-col">
      {/* Top row: badge + status */}
      <div className="flex items-center justify-between mb-6">
        {leagueName && (
          <div className="inline-flex items-center gap-2 bg-[#FAFAF7] px-3 py-1.5 rounded-full text-xs font-semibold text-bn-ink">
            {leagueDot && <span className="w-2 h-2 rounded-full" style={{ background: leagueDot }} />}
            {leagueName}
          </div>
        )}
        {isLive && (
          <div className="inline-flex items-center gap-2 bg-bn-red/10 text-bn-red px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-bn-red animate-[blink_1.2s_ease-in-out_infinite]" />
            LIVE
          </div>
        )}
        {isCompleted && (
          <div className="text-bn-slate text-[10px] font-bold tracking-[0.15em]">FINAL</div>
        )}
        {!isLive && !isCompleted && displayTime && (
          <div className="text-bn-ink text-sm font-semibold tabular-nums">{displayTime}</div>
        )}
      </div>

      {/* Matchup */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 flex-1 py-4">
        {/* Home */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <TeamEmblem
            logoUrl={homeOrg?.logo_url}
            shortName={homeOrg?.short_name ?? game.home_squad_name.slice(0, 2)}
            size="lg"
          />
          <div className="text-base font-semibold tracking-tight">{game.home_squad_name}</div>
        </div>

        {/* Score */}
        <div className="text-center">
          {isCompleted || isLive ? (
            <div className="flex items-baseline gap-3 tabular-nums">
              <span className={`text-[48px] font-semibold tracking-tighter leading-none ${
                homeWin ? 'text-bn-active' : isLive && game.home_score > game.away_score ? 'text-bn-red' : 'text-bn-slate'
              }`}>
                {game.home_score}
              </span>
              <span className="text-2xl text-bn-border font-light">–</span>
              <span className={`text-[48px] font-semibold tracking-tighter leading-none ${
                awayWin ? 'text-bn-active' : isLive && game.away_score > game.home_score ? 'text-bn-red' : 'text-bn-slate'
              }`}>
                {game.away_score}
              </span>
            </div>
          ) : (
            <div className="text-bn-slate text-sm font-medium tracking-widest">VS</div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <TeamEmblem
            logoUrl={awayOrg?.logo_url}
            shortName={awayOrg?.short_name ?? game.away_squad_name.slice(0, 2)}
            size="lg"
          />
          <div className="text-base font-semibold tracking-tight">{game.away_squad_name}</div>
        </div>
      </div>

      {/* Divider + venue */}
      <div className="border-t border-dashed border-bn-border mt-4 pt-4 text-center">
        <span className="text-xs text-bn-slate">{game.location || '場地待定'}</span>
      </div>
    </div>
  )
}
