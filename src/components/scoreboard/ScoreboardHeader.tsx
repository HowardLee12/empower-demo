'use client'

import { Team, totalScore, formatTime } from '@/lib/scoreboard-types'

interface ScoreboardHeaderProps {
  homeTeam: Team
  awayTeam: Team
  quarter: number
  timeRemaining: number
  isRunning: boolean
  onToggleTimer: () => void
  onNextQuarter: () => void
  onResetTimer: () => void
}

export function ScoreboardHeader({
  homeTeam,
  awayTeam,
  quarter,
  timeRemaining,
  isRunning,
  onToggleTimer,
  onNextQuarter,
  onResetTimer,
}: ScoreboardHeaderProps) {
  const homeScore = totalScore(homeTeam)
  const awayScore = totalScore(awayTeam)
  const quarterLabel = quarter <= 4 ? `Q${quarter}` : `OT${quarter - 4}`

  return (
    <div className="bg-navy-light border border-white/10 rounded-xl p-4 sm:p-6">
      {/* Scoreboard */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <p className="text-gold font-bold text-sm sm:text-base uppercase tracking-wider mb-1">
            {homeTeam.name || '主隊'}
          </p>
          <p className="text-5xl sm:text-7xl font-black text-white tabular-nums">
            {homeScore}
          </p>
        </div>

        {/* Center: Timer & Quarter */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-gold font-bold text-sm sm:text-lg bg-gold/10 px-3 py-0.5 rounded-full">
            {quarterLabel}
          </span>
          <span className="text-3xl sm:text-5xl font-mono font-bold text-white tabular-nums">
            {formatTime(timeRemaining)}
          </span>
          <div className="flex gap-1.5 mt-1">
            <button
              onClick={onToggleTimer}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                isRunning
                  ? 'bg-red-500/80 hover:bg-red-500 text-white'
                  : 'bg-green-500/80 hover:bg-green-500 text-white'
              }`}
            >
              {isRunning ? '暫停' : '開始'}
            </button>
            <button
              onClick={onResetTimer}
              className="px-3 py-1 rounded text-xs font-bold bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
            >
              重置
            </button>
            <button
              onClick={onNextQuarter}
              className="px-3 py-1 rounded text-xs font-bold bg-gold/20 hover:bg-gold/30 text-gold transition-colors"
            >
              下一節
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <p className="text-white/70 font-bold text-sm sm:text-base uppercase tracking-wider mb-1">
            {awayTeam.name || '客隊'}
          </p>
          <p className="text-5xl sm:text-7xl font-black text-white tabular-nums">
            {awayScore}
          </p>
        </div>
      </div>

      {/* Quarter Scores */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="text-white/40 text-xs">
              <th className="py-1 px-2 text-left font-medium">隊伍</th>
              {homeTeam.quarterScores.map((_, i) => (
                <th key={i} className={`py-1 px-2 font-medium ${i + 1 === quarter ? 'text-gold' : ''}`}>
                  Q{i + 1}
                </th>
              ))}
              <th className="py-1 px-2 font-bold text-white/60">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-white">
              <td className="py-1 px-2 text-left text-gold font-medium">{homeTeam.name || '主隊'}</td>
              {homeTeam.quarterScores.map((s, i) => (
                <td key={i} className={`py-1 px-2 tabular-nums ${i + 1 === quarter ? 'text-gold font-bold' : ''}`}>
                  {s}
                </td>
              ))}
              <td className="py-1 px-2 font-bold tabular-nums">{homeScore}</td>
            </tr>
            <tr className="text-white/80">
              <td className="py-1 px-2 text-left font-medium">{awayTeam.name || '客隊'}</td>
              {awayTeam.quarterScores.map((s, i) => (
                <td key={i} className={`py-1 px-2 tabular-nums ${i + 1 === quarter ? 'text-gold font-bold' : ''}`}>
                  {s}
                </td>
              ))}
              <td className="py-1 px-2 font-bold tabular-nums">{awayScore}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
