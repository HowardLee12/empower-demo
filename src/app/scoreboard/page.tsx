'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Team,
  Player,
  PlayerStats,
  QUARTER_MINUTES,
  totalScore,
} from '@/lib/scoreboard-types'
import { ScoreboardHeader } from '@/components/scoreboard/ScoreboardHeader'
import { PlayerStatsTable } from '@/components/scoreboard/PlayerStatsTable'
import { GameControls } from '@/components/scoreboard/GameControls'
import { GameSetup } from '@/components/scoreboard/GameSetup'
import { TeamManager } from '@/components/scoreboard/TeamManager'

type StatAction =
  | 'fg2_made' | 'fg2_miss'
  | 'fg3_made' | 'fg3_miss'
  | 'ft_made' | 'ft_miss'
  | 'off_rebound' | 'def_rebound'
  | 'assist' | 'steal' | 'block' | 'turnover' | 'foul'

interface GameState {
  readonly homeTeam: Team
  readonly awayTeam: Team
  readonly quarter: number
  readonly isRunning: boolean
  readonly timeRemaining: number
  readonly selectedPlayerId: string | null
  readonly selectedTeamId: string | null
  readonly gameDate: string
  readonly gameTime: string
  readonly location: string
  readonly substitutingPlayerId: string | null
  readonly substitutingTeamId: string | null
  readonly homeSquadId: string
  readonly awaySquadId: string
}

interface HistoryEntry {
  readonly teamId: string
  readonly playerId: string
  readonly action: StatAction | 'substitute'
  readonly quarter: number
  readonly substituteOutId?: string
}

type View = 'setup' | 'manage' | 'game'

async function saveGameToDb(game: GameState): Promise<string | null> {
  const homeScore = totalScore(game.homeTeam)
  const awayScore = totalScore(game.awayTeam)

  const { data: gameRow, error: gameErr } = await supabase
    .from('sb_games')
    .insert({
      home_squad_id: game.homeSquadId,
      away_squad_id: game.awaySquadId,
      home_squad_name: game.homeTeam.name,
      away_squad_name: game.awayTeam.name,
      game_date: game.gameDate,
      game_time: game.gameTime || null,
      location: game.location,
      status: 'completed',
      quarter_scores_home: [...game.homeTeam.quarterScores],
      quarter_scores_away: [...game.awayTeam.quarterScores],
      home_score: homeScore,
      away_score: awayScore,
    })
    .select('id')
    .single()

  if (gameErr || !gameRow) return null

  const playerStats = [
    ...game.homeTeam.players.map((p) => ({
      game_id: gameRow.id,
      player_id: p.id,
      team_side: 'home',
      player_number: p.number,
      player_name: p.name,
      points: p.stats.points,
      fg_made: p.stats.fgMade,
      fg_attempted: p.stats.fgAttempted,
      three_made: p.stats.threeMade,
      three_attempted: p.stats.threeAttempted,
      ft_made: p.stats.ftMade,
      ft_attempted: p.stats.ftAttempted,
      off_rebounds: p.stats.offRebounds,
      def_rebounds: p.stats.defRebounds,
      assists: p.stats.assists,
      steals: p.stats.steals,
      blocks: p.stats.blocks,
      turnovers: p.stats.turnovers,
      fouls: p.stats.fouls,
      playing_seconds: p.stats.playingSeconds,
      plus_minus: p.stats.plusMinus,
    })),
    ...game.awayTeam.players.map((p) => ({
      game_id: gameRow.id,
      player_id: p.id,
      team_side: 'away',
      player_number: p.number,
      player_name: p.name,
      points: p.stats.points,
      fg_made: p.stats.fgMade,
      fg_attempted: p.stats.fgAttempted,
      three_made: p.stats.threeMade,
      three_attempted: p.stats.threeAttempted,
      ft_made: p.stats.ftMade,
      ft_attempted: p.stats.ftAttempted,
      off_rebounds: p.stats.offRebounds,
      def_rebounds: p.stats.defRebounds,
      assists: p.stats.assists,
      steals: p.stats.steals,
      blocks: p.stats.blocks,
      turnovers: p.stats.turnovers,
      fouls: p.stats.fouls,
      playing_seconds: p.stats.playingSeconds,
      plus_minus: p.stats.plusMinus,
    })),
  ]

  await supabase.from('sb_player_stats').insert(playerStats)
  return gameRow.id
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

function updateOnCourtPlayers(team: Team, updater: (s: PlayerStats) => PlayerStats): Team {
  return {
    ...team,
    players: team.players.map((p) =>
      team.onCourtIds.includes(p.id) ? { ...p, stats: updater(p.stats) } : p
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

function substitutePlayer(team: Team, outId: string, inId: string): Team {
  return {
    ...team,
    onCourtIds: team.onCourtIds.map((id) => id === outId ? inId : id),
  }
}

export default function ScoreboardPage() {
  const [view, setView] = useState<View>('setup')
  const [game, setGame] = useState<GameState | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleStartGame = (homeTeam: Team, awayTeam: Team, gameDate: string, gameTime: string, location: string, homeSquadId: string, awaySquadId: string) => {
    setGame({
      homeTeam,
      awayTeam,
      quarter: 1,
      isRunning: false,
      timeRemaining: QUARTER_MINUTES * 60,
      selectedPlayerId: null,
      selectedTeamId: null,
      substitutingPlayerId: null,
      substitutingTeamId: null,
      gameDate,
      gameTime,
      location,
      homeSquadId,
      awaySquadId,
    })
    setHistory([])
    setView('game')
  }

  // Timer: count down + accumulate playing time for on-court players
  useEffect(() => {
    if (!game) return

    if (game.isRunning && game.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setGame((prev) => {
          if (!prev || prev.timeRemaining <= 0) return prev
          const addSecond = (s: PlayerStats): PlayerStats => ({
            ...s,
            playingSeconds: s.playingSeconds + 1,
          })
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
            homeTeam: updateOnCourtPlayers(prev.homeTeam, addSecond),
            awayTeam: updateOnCourtPlayers(prev.awayTeam, addSecond),
          }
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
    setGame((prev) => {
      if (!prev) return prev

      // If we're in substitution mode and clicking a bench player from the same team
      if (prev.substitutingPlayerId && prev.substitutingTeamId === teamId) {
        const team = teamId === 'home' ? prev.homeTeam : prev.awayTeam
        const isBench = !team.onCourtIds.includes(playerId)
        if (isBench) {
          // Execute substitution
          const updatedTeam = substitutePlayer(team, prev.substitutingPlayerId, playerId)
          setHistory((h) => [
            ...h,
            { teamId, playerId, action: 'substitute' as const, quarter: prev.quarter, substituteOutId: prev.substitutingPlayerId! },
          ])
          return {
            ...prev,
            homeTeam: teamId === 'home' ? updatedTeam : prev.homeTeam,
            awayTeam: teamId === 'away' ? updatedTeam : prev.awayTeam,
            substitutingPlayerId: null,
            substitutingTeamId: null,
            selectedPlayerId: playerId,
            selectedTeamId: teamId,
          }
        }
      }

      // Cancel substitution mode if clicking elsewhere
      return {
        ...prev,
        selectedPlayerId: playerId,
        selectedTeamId: teamId,
        substitutingPlayerId: null,
        substitutingTeamId: null,
      }
    })
  }, [])

  const handleSubstitute = useCallback(() => {
    setGame((prev) => {
      if (!prev?.selectedPlayerId || !prev?.selectedTeamId) return prev
      const team = prev.selectedTeamId === 'home' ? prev.homeTeam : prev.awayTeam
      if (!team.onCourtIds.includes(prev.selectedPlayerId)) return prev
      return {
        ...prev,
        substitutingPlayerId: prev.selectedPlayerId,
        substitutingTeamId: prev.selectedTeamId,
      }
    })
  }, [])

  const cancelSubstitute = useCallback(() => {
    setGame((prev) => prev ? { ...prev, substitutingPlayerId: null, substitutingTeamId: null } : prev)
  }, [])

  const handleAction = useCallback((action: StatAction) => {
    setGame((prev) => {
      if (!prev?.selectedPlayerId || !prev?.selectedTeamId) return prev

      const isHome = prev.selectedTeamId === 'home'
      const team = isHome ? prev.homeTeam : prev.awayTeam
      const player = team.players.find((p) => p.id === prev.selectedPlayerId)
      if (!player) return prev

      const updatedTeam = updateTeamPlayer(team, prev.selectedPlayerId, (s) => applyAction(s, action))
      const scorePoints = getScoreFromAction(action)
      const teamWithScore = scorePoints > 0
        ? updateQuarterScore(updatedTeam, prev.quarter, scorePoints)
        : updatedTeam

      // Apply +/- to all on-court players of both teams
      let newHome = isHome ? teamWithScore : prev.homeTeam
      let newAway = isHome ? prev.awayTeam : teamWithScore

      if (scorePoints > 0) {
        // Scoring team on-court players get + points, opponent on-court get - points
        newHome = updateOnCourtPlayers(newHome, (s) => ({
          ...s,
          plusMinus: s.plusMinus + (isHome ? scorePoints : -scorePoints),
        }))
        newAway = updateOnCourtPlayers(newAway, (s) => ({
          ...s,
          plusMinus: s.plusMinus + (isHome ? -scorePoints : scorePoints),
        }))
      }

      const teamId = prev.selectedTeamId
      const playerId = prev.selectedPlayerId
      setHistory((h) => [
        ...h,
        { teamId, playerId, action, quarter: prev.quarter },
      ])

      return { ...prev, homeTeam: newHome, awayTeam: newAway }
    })
  }, [])

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev.at(-1)!

      if (last.action === 'substitute') {
        // Undo substitution: swap back
        setGame((g) => {
          if (!g || !last.substituteOutId) return g
          const isHome = last.teamId === 'home'
          const team = isHome ? g.homeTeam : g.awayTeam
          const reverted = substitutePlayer(team, last.playerId, last.substituteOutId)
          return {
            ...g,
            homeTeam: isHome ? reverted : g.homeTeam,
            awayTeam: isHome ? g.awayTeam : reverted,
          }
        })
      } else {
        setGame((g) => {
          if (!g) return g
          const isHome = last.teamId === 'home'
          const team = isHome ? g.homeTeam : g.awayTeam
          const updatedTeam = updateTeamPlayer(team, last.playerId, (s) => reverseAction(s, last.action as StatAction))
          const scorePoints = getScoreFromAction(last.action as StatAction)
          const teamWithScore = scorePoints > 0
            ? updateQuarterScore(updatedTeam, last.quarter, -scorePoints)
            : updatedTeam

          let newHome = isHome ? teamWithScore : g.homeTeam
          let newAway = isHome ? g.awayTeam : teamWithScore

          if (scorePoints > 0) {
            newHome = updateOnCourtPlayers(newHome, (s) => ({
              ...s,
              plusMinus: s.plusMinus + (isHome ? -scorePoints : scorePoints),
            }))
            newAway = updateOnCourtPlayers(newAway, (s) => ({
              ...s,
              plusMinus: s.plusMinus + (isHome ? scorePoints : -scorePoints),
            }))
          }

          return { ...g, homeTeam: newHome, awayTeam: newAway }
        })
      }

      return prev.slice(0, -1)
    })
  }, [])

  // --- View: Team Manager ---
  if (view === 'manage') {
    return <TeamManager onBack={() => setView('setup')} />
  }

  // --- View: Game Setup ---
  if (view === 'setup' || !game) {
    return (
      <GameSetup
        onStartGame={handleStartGame}
        onManageTeams={() => setView('manage')}
      />
    )
  }

  // --- View: Game ---
  const selectedPlayer: Player | null = (() => {
    if (!game.selectedPlayerId || !game.selectedTeamId) return null
    const team = game.selectedTeamId === 'home' ? game.homeTeam : game.awayTeam
    return team.players.find((p) => p.id === game.selectedPlayerId) ?? null
  })()

  const selectedIsHome = game.selectedTeamId === 'home'
  const selectedTeam = selectedIsHome ? game.homeTeam : game.awayTeam
  const selectedIsOnCourt = selectedPlayer ? selectedTeam.onCourtIds.includes(selectedPlayer.id) : false

  return (
    <div className="min-h-screen bg-[#060f1d]">
      <header className="bg-gradient-to-r from-navy-light via-[#0d2847] to-navy-light border-b border-white/[0.06] px-4 py-3 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-black text-lg tracking-widest">
              EMPOWER
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">紀錄台</span>
            {game.gameDate && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-white/25 text-[11px] tabular-nums">
                  {game.gameDate} {game.gameTime}{game.location ? ` @ ${game.location}` : ''}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/scoreboard/history"
              className="text-white/25 hover:text-white/50 text-xs transition-colors"
            >
              歷史紀錄
            </Link>
            <button
              disabled={saving}
              onClick={async () => {
                if (!game) return
                setSaving(true)
                game.isRunning && setGame((prev) => prev ? { ...prev, isRunning: false } : prev)
                const gameId = await saveGameToDb(game)
                setSaving(false)
                setGame(null)
                if (gameId) {
                  window.location.href = `/scoreboard/games/${gameId}`
                } else {
                  setView('setup')
                }
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-gold/10 hover:bg-gold/20 text-gold/70 hover:text-gold border border-gold/10 transition-all disabled:opacity-40"
            >
              {saving ? '儲存中...' : '結束並儲存'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
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

        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-4">
            <PlayerStatsTable
              players={game.homeTeam.players}
              onCourtIds={game.homeTeam.onCourtIds}
              teamName={game.homeTeam.name}
              isHome={true}
              selectedPlayerId={game.selectedTeamId === 'home' ? game.selectedPlayerId : null}
              substitutingPlayerId={game.substitutingTeamId === 'home' ? game.substitutingPlayerId : null}
              onSelectPlayer={(id) => selectPlayer('home', id)}
            />
            <PlayerStatsTable
              players={game.awayTeam.players}
              onCourtIds={game.awayTeam.onCourtIds}
              teamName={game.awayTeam.name}
              isHome={false}
              selectedPlayerId={game.selectedTeamId === 'away' ? game.selectedPlayerId : null}
              substitutingPlayerId={game.substitutingTeamId === 'away' ? game.substitutingPlayerId : null}
              onSelectPlayer={(id) => selectPlayer('away', id)}
            />
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <GameControls
              selectedPlayer={selectedPlayer}
              teamName={selectedIsHome ? game.homeTeam.name : game.awayTeam.name}
              isHome={selectedIsHome}
              isOnCourt={selectedIsOnCourt}
              isSubstituting={!!game.substitutingPlayerId}
              onAction={handleAction}
              onSubstitute={handleSubstitute}
              onCancelSubstitute={cancelSubstitute}
              onUndo={handleUndo}
              canUndo={history.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
