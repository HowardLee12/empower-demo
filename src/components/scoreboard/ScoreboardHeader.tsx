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
  const isLowTime = timeRemaining <= 60 && isRunning

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gold/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative px-6 pt-8 pb-6">
        {/* Main scoreboard */}
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-gold font-semibold text-xs tracking-widest uppercase">
                {homeTeam.name || '主隊'}
              </span>
            </div>
            <p className="text-6xl sm:text-8xl font-black text-white tabular-nums tracking-tight leading-none">
              {homeScore}
            </p>
          </div>

          {/* Center: Timer & Quarter */}
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="px-4 py-1 rounded-full bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border border-gold/20">
              <span className="text-gold font-black text-base tracking-wider">
                {quarterLabel}
              </span>
            </div>
            <div className={`text-4xl sm:text-6xl font-mono font-black tabular-nums tracking-wider ${isLowTime ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={onToggleTimer}
                className={`px-5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-lg ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
                }`}
              >
                {isRunning ? 'STOP' : 'START'}
              </button>
              <button
                onClick={onResetTimer}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white/80 transition-all border border-white/[0.06]"
              >
                重置
              </button>
              <button
                onClick={onNextQuarter}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-gold/10 hover:bg-gold/20 text-gold/80 hover:text-gold transition-all border border-gold/10"
              >
                下一節
              </button>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-white/60 font-semibold text-xs tracking-widest uppercase">
                {awayTeam.name || '客隊'}
              </span>
            </div>
            <p className="text-6xl sm:text-8xl font-black text-white tabular-nums tracking-tight leading-none">
              {awayScore}
            </p>
          </div>
        </div>
      </div>

      {/* Quarter Scores bar */}
      <div className="border-t border-white/[0.06] bg-white/[0.02] px-6 py-3">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="text-white/30 text-[10px] tracking-widest uppercase">
              <th className="py-1 px-3 text-left font-medium w-40">隊伍</th>
              {homeTeam.quarterScores.map((_, i) => (
                <th key={i} className={`py-1 px-3 font-medium ${i + 1 === quarter ? 'text-gold' : ''}`}>
                  Q{i + 1}
                </th>
              ))}
              <th className="py-1 px-3 font-bold text-white/50">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-white/90">
              <td className="py-1.5 px-3 text-left font-semibold text-gold text-xs">{homeTeam.name || '主隊'}</td>
              {homeTeam.quarterScores.map((s, i) => (
                <td key={i} className={`py-1.5 px-3 tabular-nums text-sm ${i + 1 === quarter ? 'text-gold font-bold' : 'text-white/60'}`}>
                  {s}
                </td>
              ))}
              <td className="py-1.5 px-3 font-black tabular-nums text-sm">{homeScore}</td>
            </tr>
            <tr className="text-white/70">
              <td className="py-1.5 px-3 text-left font-semibold text-xs">{awayTeam.name || '客隊'}</td>
              {awayTeam.quarterScores.map((s, i) => (
                <td key={i} className={`py-1.5 px-3 tabular-nums text-sm ${i + 1 === quarter ? 'text-gold font-bold' : 'text-white/50'}`}>
                  {s}
                </td>
              ))}
              <td className="py-1.5 px-3 font-black tabular-nums text-sm">{awayScore}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
