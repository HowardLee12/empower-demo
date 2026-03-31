'use client'

import { Player } from '@/lib/scoreboard-types'

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
  onAction: (action: StatAction) => void
  onUndo: () => void
  canUndo: boolean
}

export function GameControls({
  selectedPlayer,
  teamName,
  isHome,
  onAction,
  onUndo,
  canUndo,
}: GameControlsProps) {
  const btnBase = 'rounded-lg font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed'
  const disabled = !selectedPlayer

  return (
    <div className="bg-navy-light border border-white/10 rounded-xl p-4">
      {/* Selected Player Info */}
      <div className={`text-center mb-4 pb-3 border-b border-white/10 ${isHome ? 'text-gold' : 'text-white'}`}>
        {selectedPlayer ? (
          <div>
            <span className="text-white/40 text-xs">紀錄中</span>
            <p className="text-xl font-black">
              #{selectedPlayer.number} {selectedPlayer.name}
            </p>
            <p className="text-xs text-white/40">{teamName}</p>
          </div>
        ) : (
          <p className="text-white/30 text-sm py-2">請先點選球員</p>
        )}
      </div>

      {/* Scoring */}
      <div className="mb-4">
        <p className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">得分</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <button
              disabled={disabled}
              onClick={() => onAction('fg2_made')}
              className={`${btnBase} w-full py-3 bg-green-600/80 hover:bg-green-600 text-white text-sm`}
            >
              2分 ✓
            </button>
            <button
              disabled={disabled}
              onClick={() => onAction('fg2_miss')}
              className={`${btnBase} w-full py-2 bg-red-600/40 hover:bg-red-600/60 text-white/70 text-xs`}
            >
              2分 ✗
            </button>
          </div>
          <div className="space-y-1.5">
            <button
              disabled={disabled}
              onClick={() => onAction('fg3_made')}
              className={`${btnBase} w-full py-3 bg-green-600/80 hover:bg-green-600 text-white text-sm`}
            >
              3分 ✓
            </button>
            <button
              disabled={disabled}
              onClick={() => onAction('fg3_miss')}
              className={`${btnBase} w-full py-2 bg-red-600/40 hover:bg-red-600/60 text-white/70 text-xs`}
            >
              3分 ✗
            </button>
          </div>
          <div className="space-y-1.5">
            <button
              disabled={disabled}
              onClick={() => onAction('ft_made')}
              className={`${btnBase} w-full py-3 bg-green-600/80 hover:bg-green-600 text-white text-sm`}
            >
              罰球 ✓
            </button>
            <button
              disabled={disabled}
              onClick={() => onAction('ft_miss')}
              className={`${btnBase} w-full py-2 bg-red-600/40 hover:bg-red-600/60 text-white/70 text-xs`}
            >
              罰球 ✗
            </button>
          </div>
        </div>
      </div>

      {/* Other Stats */}
      <div className="mb-4">
        <p className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">數據</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            disabled={disabled}
            onClick={() => onAction('off_rebound')}
            className={`${btnBase} py-2.5 bg-blue-600/40 hover:bg-blue-600/60 text-white text-xs`}
          >
            進攻籃板
          </button>
          <button
            disabled={disabled}
            onClick={() => onAction('def_rebound')}
            className={`${btnBase} py-2.5 bg-blue-600/40 hover:bg-blue-600/60 text-white text-xs`}
          >
            防守籃板
          </button>
          <button
            disabled={disabled}
            onClick={() => onAction('assist')}
            className={`${btnBase} py-2.5 bg-blue-600/40 hover:bg-blue-600/60 text-white text-xs`}
          >
            助攻
          </button>
          <button
            disabled={disabled}
            onClick={() => onAction('steal')}
            className={`${btnBase} py-2.5 bg-blue-600/40 hover:bg-blue-600/60 text-white text-xs`}
          >
            抄截
          </button>
          <button
            disabled={disabled}
            onClick={() => onAction('block')}
            className={`${btnBase} py-2.5 bg-blue-600/40 hover:bg-blue-600/60 text-white text-xs`}
          >
            阻攻
          </button>
          <button
            disabled={disabled}
            onClick={() => onAction('turnover')}
            className={`${btnBase} py-2.5 bg-orange-600/40 hover:bg-orange-600/60 text-white text-xs`}
          >
            失誤
          </button>
        </div>
      </div>

      {/* Foul */}
      <div className="mb-4">
        <p className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">犯規</p>
        <button
          disabled={disabled}
          onClick={() => onAction('foul')}
          className={`${btnBase} w-full py-2.5 bg-red-600/60 hover:bg-red-600/80 text-white text-sm`}
        >
          犯規 +1
        </button>
      </div>

      {/* Undo */}
      <button
        disabled={!canUndo}
        onClick={onUndo}
        className={`${btnBase} w-full py-2 bg-white/10 hover:bg-white/20 text-white/60 text-xs`}
      >
        復原上一步
      </button>
    </div>
  )
}
