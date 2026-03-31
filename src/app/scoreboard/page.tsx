'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  GameState,
  Team,
  Player,
  PlayerStats,
  QUARTER_MINUTES,
} from '@/lib/scoreboard-types'
import { ScoreboardHeader } from '@/components/scoreboard/ScoreboardHeader'
import { PlayerStatsTable } from '@/components/scoreboard/PlayerStatsTable'
import { GameControls } from '@/components/scoreboard/GameControls'
import { TeamSetup } from '@/components/scoreboard/TeamSetup'

type StatAction =
  | 'fg2_made' | 'fg2_miss'
  | 'fg3_made' | 'fg3_miss'
  | 'ft_made' | 'ft_miss'
  | 'off_rebound' | 'def_rebound'
  | 'assist' | 'steal' | 'block' | 'turnover' | 'foul'

interface HistoryEntry {
  readonly teamId: string
  readonly playerId: string
  readonly action: StatAction
  readonly quarter: number
}

function applyAction(stats: PlayerStats, action: StatAction): PlayerStats {
  switch (action) {
    case 'fg2_made':
      return { ...stats, points: stats.points + 2, fgMade: stats.fgMade + 1, fgAttempted: stats.fgAttempted + 1 }
    case 'fg2_miss':
      return { ...stats, fgAttempted: stats.fgAttempted + 1 }
    case 'fg3_made':
      return { ...stats, points: stats.points + 3, threeMade: stats.threeMade + 1, threeAttempted: stats.threeAttempted + 1 }
    case 'fg3_miss':
      return { ...stats, threeAttempted: stats.threeAttempted + 1 }
    case 'ft_made':
      return { ...stats, points: stats.points + 1, ftMade: stats.ftMade + 1, ftAttempted: stats.ftAttempted + 1 }
    case 'ft_miss':
      return { ...stats, ftAttempted: stats.ftAttempted + 1 }
    case 'off_rebound':
      return { ...stats, offRebounds: stats.offRebounds + 1 }
    case 'def_rebound':
      return { ...stats, defRebounds: stats.defRebounds + 1 }
    case 'assist':
      return { ...stats, assists: stats.assists + 1 }
    case 'steal':
      return { ...stats, steals: stats.steals + 1 }
    case 'block':
      return { ...stats, blocks: stats.blocks + 1 }
    case 'turnover':
      return { ...stats, turnovers: stats.turnovers + 1 }
    case 'foul':
      return { ...stats, fouls: stats.fouls + 1 }
  }
}

function reverseAction(stats: PlayerStats, action: StatAction): PlayerStats {
  switch (action) {
    case 'fg2_made':
      return { ...stats, points: stats.points - 2, fgMade: stats.fgMade - 1, fgAttempted: stats.fgAttempted - 1 }
    case 'fg2_miss':
      return { ...stats, fgAttempted: stats.fgAttempted - 1 }
    case 'fg3_made':
      return { ...stats, points: stats.points - 3, threeMade: stats.threeMade - 1, threeAttempted: stats.threeAttempted - 1 }
    case 'fg3_miss':
      return { ...stats, threeAttempted: stats.threeAttempted - 1 }
    case 'ft_made':
      return { ...stats, points: stats.points - 1, ftMade: stats.ftMade - 1, ftAttempted: stats.ftAttempted - 1 }
    case 'ft_miss':
      return { ...stats, ftAttempted: stats.ftAttempted - 1 }
    case 'off_rebound':
      return { ...stats, offRebounds: stats.offRebounds - 1 }
    case 'def_rebound':
      return { ...stats, defRebounds: stats.defRebounds - 1 }
    case 'assist':
      return { ...stats, assists: stats.assists - 1 }
    case 'steal':
      return { ...stats, steals: stats.steals - 1 }
    case 'block':
      return { ...stats, blocks: stats.blocks - 1 }
    case 'turnover':
      return { ...stats, turnovers: stats.turnovers - 1 }
    case 'foul':
      return { ...stats, fouls: stats.fouls - 1 }
  }
}

function getScoreFromAction(action: StatAction): number {
  switch (action) {
    case 'fg2_made': return 2
    case 'fg3_made': return 3
    case 'ft_made': return 1
    default: return 0
  }
}

function updateTeamPlayer(team: Team, playerId: string, updater: (s: PlayerStats) => PlayerStats): Team {
  return {
    ...team,
    players: team.players.map((p) =>
      p.id === playerId ? { ...p, stats: updater(p.stats) } : p
    ),
  }
}

function updateQuarterScore(team: Team, quarter: number, delta: number): Team {
  return {
    ...team,
    quarterScores: team.quarterScores.map((s, i) =>
      i === quarter - 1 ? s + delta : s
    ),
  }
}

export default function ScoreboardPage() {
  const [game, setGame] = useState<GameState | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleStartGame = (homeTeam: Team, awayTeam: Team) => {
    setGame({
      homeTeam,
      awayTeam,
      quarter: 1,
      isRunning: false,
      timeRemaining: QUARTER_MINUTES * 60,
      selectedPlayerId: null,
      selectedTeamId: null,
    })
    setHistory([])
  }

  // Timer effect
  useEffect(() => {
    if (!game) return

    if (game.isRunning && game.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setGame((prev) => {
          if (!prev || prev.timeRemaining <= 0) return prev
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [game?.isRunning, game?.timeRemaining])

  const toggleTimer = useCallback(() => {
    setGame((prev) => prev ? { ...prev, isRunning: !prev.isRunning } : prev)
  }, [])

  const resetTimer = useCallback(() => {
    setGame((prev) => prev ? { ...prev, isRunning: false, timeRemaining: QUARTER_MINUTES * 60 } : prev)
  }, [])

  const nextQuarter = useCallback(() => {
    setGame((prev) => {
      if (!prev) return prev
      const next = prev.quarter + 1
      const needsOT = next > 4
      return {
        ...prev,
        quarter: next,
        isRunning: false,
        timeRemaining: (needsOT ? 5 : QUARTER_MINUTES) * 60,
        homeTeam: needsOT
          ? { ...prev.homeTeam, quarterScores: [...prev.homeTeam.quarterScores, 0] }
          : prev.homeTeam,
        awayTeam: needsOT
          ? { ...prev.awayTeam, quarterScores: [...prev.awayTeam.quarterScores, 0] }
          : prev.awayTeam,
      }
    })
  }, [])

  const selectPlayer = useCallback((teamId: string, playerId: string) => {
    setGame((prev) => prev ? { ...prev, selectedPlayerId: playerId, selectedTeamId: teamId } : prev)
  }, [])

  const handleAction = useCallback((action: StatAction) => {
    setGame((prev) => {
      if (!prev || !prev.selectedPlayerId || !prev.selectedTeamId) return prev

      const isHome = prev.selectedTeamId === 'home'
      const team = isHome ? prev.homeTeam : prev.awayTeam
      const player = team.players.find((p) => p.id === prev.selectedPlayerId)
      if (!player) return prev

      const updatedTeam = updateTeamPlayer(team, prev.selectedPlayerId, (s) => applyAction(s, action))
      const scorePoints = getScoreFromAction(action)
      const teamWithScore = scorePoints > 0
        ? updateQuarterScore(updatedTeam, prev.quarter, scorePoints)
        : updatedTeam

      return {
        ...prev,
        homeTeam: isHome ? teamWithScore : prev.homeTeam,
        awayTeam: isHome ? prev.awayTeam : teamWithScore,
      }
    })

    setGame((prev) => {
      if (!prev || !prev.selectedPlayerId || !prev.selectedTeamId) return prev
      setHistory((h) => [
        ...h,
        {
          teamId: prev.selectedTeamId!,
          playerId: prev.selectedPlayerId!,
          action,
          quarter: prev.quarter,
        },
      ])
      return prev
    })
  }, [])

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]

      setGame((g) => {
        if (!g) return g
        const isHome = last.teamId === 'home'
        const team = isHome ? g.homeTeam : g.awayTeam
        const updatedTeam = updateTeamPlayer(team, last.playerId, (s) => reverseAction(s, last.action))
        const scorePoints = getScoreFromAction(last.action)
        const teamWithScore = scorePoints > 0
          ? updateQuarterScore(updatedTeam, last.quarter, -scorePoints)
          : updatedTeam

        return {
          ...g,
          homeTeam: isHome ? teamWithScore : g.homeTeam,
          awayTeam: isHome ? g.awayTeam : teamWithScore,
        }
      })

      return prev.slice(0, -1)
    })
  }, [])

  if (!game) {
    return <TeamSetup onStartGame={handleStartGame} />
  }

  const selectedPlayer: Player | null = (() => {
    if (!game.selectedPlayerId || !game.selectedTeamId) return null
    const team = game.selectedTeamId === 'home' ? game.homeTeam : game.awayTeam
    return team.players.find((p) => p.id === game.selectedPlayerId) ?? null
  })()

  const selectedIsHome = game.selectedTeamId === 'home'

  return (
    <div className="min-h-screen bg-navy">
      {/* Top Bar */}
      <header className="bg-navy-light border-b border-white/10 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-bold text-lg tracking-wider">
              EMPOWER
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-white/50 text-sm font-medium">紀錄台</span>
          </div>
          <button
            onClick={() => setGame(null)}
            className="text-white/40 hover:text-white text-xs transition-colors"
          >
            重新開始
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 space-y-4">
        {/* Scoreboard Header */}
        <ScoreboardHeader
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          quarter={game.quarter}
          timeRemaining={game.timeRemaining}
          isRunning={game.isRunning}
          onToggleTimer={toggleTimer}
          onNextQuarter={nextQuarter}
          onResetTimer={resetTimer}
        />

        {/* Main Content: Stats Tables + Controls */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-4">
            <PlayerStatsTable
              players={game.homeTeam.players}
              teamName={game.homeTeam.name}
              isHome={true}
              selectedPlayerId={game.selectedTeamId === 'home' ? game.selectedPlayerId : null}
              onSelectPlayer={(id) => selectPlayer('home', id)}
            />
            <PlayerStatsTable
              players={game.awayTeam.players}
              teamName={game.awayTeam.name}
              isHome={false}
              selectedPlayerId={game.selectedTeamId === 'away' ? game.selectedPlayerId : null}
              onSelectPlayer={(id) => selectPlayer('away', id)}
            />
          </div>

          {/* Controls Sidebar */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <GameControls
              selectedPlayer={selectedPlayer}
              teamName={selectedIsHome ? game.homeTeam.name : game.awayTeam.name}
              isHome={selectedIsHome}
              onAction={handleAction}
              onUndo={handleUndo}
              canUndo={history.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
