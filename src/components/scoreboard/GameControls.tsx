'use client'

import { Player, formatPlayingTime } from '@/lib/scoreboard-types'

type StatAction =
  | 'fg2_made' | 'fg2_miss'
  | 'fg3_made' | 'fg3_miss'
  | 'ft_made' | 'ft_miss'
  | 'off_rebound' | 'def_rebound'
  | 'assist' | 'steal' | 'block' | 'turnover' | 'foul'

interface GameControlsProps {
  selectedPlayer: Player | null
  teamName: string
  isHome: boolean
  isOnCourt: boolean
  isSubstituting: boolean
  onAction: (action: StatAction) => void
  onSubstitute: () => void
  onCancelSubstitute: () => void
  onUndo: () => void
  canUndo: boolean
}

export function GameControls({
  selectedPlayer,
  teamName,
  isHome,
  isOnCourt,
  isSubstituting,
  onAction,
  onSubstitute,
  onCancelSubstitute,
  onUndo,
  canUndo,
}: GameControlsProps) {
  const btn = 'rounded-xl font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100'
  const disabled = !selectedPlayer || !isOnCourt

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Selected Player Header */}
      <div className={`px-5 py-4 border-b border-white/[0.06] ${selectedPlayer ? (isHome ? 'bg-gold/[0.08]' : 'bg-white/[0.04]') : ''}`}>
        {selectedPlayer ? (
          <div className="text-center">
            <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase mb-1 ${isOnCourt ? 'text-emerald-400' : 'text-white/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnCourt ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
              {isOnCourt ? '場上' : '板凳'}
            </div>
            <p className={`text-2xl font-black tracking-tight ${isHome ? 'text-gold' : 'text-white'}`}>
              #{selectedPlayer.number} {selectedPlayer.name}
            </p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-white/30 text-xs">{teamName}</span>
              <span className="text-white/10">|</span>
              <span className="text-white/30 text-xs tabular-nums">{formatPlayingTime(selectedPlayer.stats.playingSeconds)}</span>
              <span className="text-white/10">|</span>
              <span className="text-gold text-xs font-bold tabular-nums">{selectedPlayer.stats.points} PTS</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-dashed border-white/10 mx-auto mb-2 flex items-center justify-center">
              <span className="text-white/15 text-lg">?</span>
            </div>
            <p className="text-white/20 text-xs">點選場上球員開始紀錄</p>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Substitution */}
        {selectedPlayer && isOnCourt && !isSubstituting && (
          <button
            onClick={onSubstitute}
            className={`${btn} w-full py-3 bg-gradient-to-r from-cyan-600/30 to-cyan-500/20 hover:from-cyan-600/50 hover:to-cyan-500/30 text-cyan-300 text-sm border border-cyan-500/20`}
          >
            換人
          </button>
        )}

        {isSubstituting && (
          <div className="p-4 rounded-xl bg-cyan-500/[0.08] border border-cyan-400/20">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <p className="text-cyan-400 text-xs font-semibold tracking-wide">
                點選板凳球員完成換人
              </p>
            </div>
            <button
              onClick={onCancelSubstitute}
              className={`${btn} w-full py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white/40 text-xs border border-white/[0.06]`}
            >
              取消
            </button>
          </div>
        )}

        {/* Scoring */}
        <div>
          <p className="text-white/25 text-[10px] font-semibold mb-2 tracking-[0.2em] uppercase">得分</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <button
                disabled={disabled}
                onClick={() => onAction('fg2_made')}
                className={`${btn} w-full py-3.5 bg-gradient-to-b from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400/80 hover:to-emerald-500/80 text-white text-sm shadow-lg shadow-emerald-900/30`}
              >
                2分
              </button>
              <button
                disabled={disabled}
                onClick={() => onAction('fg2_miss')}
                className={`${btn} w-full py-2 bg-white/[0.04] hover:bg-red-500/20 text-white/30 hover:text-red-300 text-[10px] border border-white/[0.04]`}
              >
                不進
              </button>
            </div>
            <div className="space-y-1.5">
              <button
                disabled={disabled}
                onClick={() => onAction('fg3_made')}
                className={`${btn} w-full py-3.5 bg-gradient-to-b from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400/80 hover:to-emerald-500/80 text-white text-sm shadow-lg shadow-emerald-900/30`}
              >
                3分
              </button>
              <button
                disabled={disabled}
                onClick={() => onAction('fg3_miss')}
                className={`${btn} w-full py-2 bg-white/[0.04] hover:bg-red-500/20 text-white/30 hover:text-red-300 text-[10px] border border-white/[0.04]`}
              >
                不進
              </button>
            </div>
            <div className="space-y-1.5">
              <button
                disabled={disabled}
                onClick={() => onAction('ft_made')}
                className={`${btn} w-full py-3.5 bg-gradient-to-b from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400/80 hover:to-emerald-500/80 text-white text-sm shadow-lg shadow-emerald-900/30`}
              >
                罰球
              </button>
              <button
                disabled={disabled}
                onClick={() => onAction('ft_miss')}
                className={`${btn} w-full py-2 bg-white/[0.04] hover:bg-red-500/20 text-white/30 hover:text-red-300 text-[10px] border border-white/[0.04]`}
              >
                不進
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-white/25 text-[10px] font-semibold mb-2 tracking-[0.2em] uppercase">數據</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '進攻籃板', action: 'off_rebound' as StatAction },
              { label: '防守籃板', action: 'def_rebound' as StatAction },
              { label: '助攻', action: 'assist' as StatAction },
              { label: '抄截', action: 'steal' as StatAction },
              { label: '阻攻', action: 'block' as StatAction },
              { label: '失誤', action: 'turnover' as StatAction },
            ].map(({ label, action }) => (
              <button
                key={action}
                disabled={disabled}
                onClick={() => onAction(action)}
                className={`${btn} py-3 text-[11px] ${
                  action === 'turnover'
                    ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300/70 hover:text-orange-300 border border-orange-500/10'
                    : 'bg-white/[0.04] hover:bg-blue-500/15 text-white/50 hover:text-blue-300 border border-white/[0.04]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Foul */}
        <button
          disabled={disabled}
          onClick={() => onAction('foul')}
          className={`${btn} w-full py-3 bg-gradient-to-r from-red-600/30 to-red-500/20 hover:from-red-600/50 hover:to-red-500/30 text-red-300 text-sm border border-red-500/15`}
        >
          犯規 +1
        </button>

        {/* Undo */}
        <button
          disabled={!canUndo}
          onClick={onUndo}
          className={`${btn} w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/25 hover:text-white/50 text-xs border border-white/[0.04]`}
        >
          復原上一步
        </button>
      </div>
    </div>
  )
}
