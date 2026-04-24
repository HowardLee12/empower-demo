'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Team, Player, PlayerStats, QUARTER_MINUTES, totalScore,
  createPlayer, createTeam,
} from '@/lib/scoreboard-types'
import {
  StatAction, HistoryEntry,
  applyAction, reverseAction, getScoreFromAction,
  updateTeamPlayer, updateOnCourtPlayers, updateQuarterScore, substitutePlayer,
} from '@/lib/game-engine'
import { ScoreboardHeader } from '@/components/scoreboard/ScoreboardHeader'
import { PlayerStatsTable } from '@/components/scoreboard/PlayerStatsTable'
import { GameControls } from '@/components/scoreboard/GameControls'

interface GameRecord {
  id: string
  home_squad_id: string; away_squad_id: string
  home_squad_name: string; away_squad_name: string
  game_date: string; game_time: string | null
  location: string; status: string; league_id: string | null
}

interface GameState {
  readonly homeTeam: Team
  readonly awayTeam: Team
  readonly quarter: number
  readonly isRunning: boolean
  readonly timeRemaining: number
  readonly selectedPlayerId: string | null
  readonly selectedTeamId: string | null
  readonly substitutingPlayerId: string | null
  readonly substitutingTeamId: string | null
}

async function saveGame(dbGameId: string, state: GameState): Promise<boolean> {
  const homeScore = totalScore(state.homeTeam)
  const awayScore = totalScore(state.awayTeam)

  const { error: gameErr } = await supabase
    .from('sb_games')
    .update({
      status: 'completed',
      quarter_scores_home: [...state.homeTeam.quarterScores],
      quarter_scores_away: [...state.awayTeam.quarterScores],
      home_score: homeScore,
      away_score: awayScore,
    })
    .eq('id', dbGameId)

  if (gameErr) return false

  // Delete any existing stats (prevent duplicates on re-save)
  await supabase.from('sb_player_stats').delete().eq('game_id', dbGameId)

  const playerStats = [
    ...state.homeTeam.players.map((p) => ({
      game_id: dbGameId, player_id: p.id, team_side: 'home',
      player_number: p.number, player_name: p.name,
      points: p.stats.points, fg_made: p.stats.fgMade, fg_attempted: p.stats.fgAttempted,
      three_made: p.stats.threeMade, three_attempted: p.stats.threeAttempted,
      ft_made: p.stats.ftMade, ft_attempted: p.stats.ftAttempted,
      off_rebounds: p.stats.offRebounds, def_rebounds: p.stats.defRebounds,
      assists: p.stats.assists, steals: p.stats.steals, blocks: p.stats.blocks,
      turnovers: p.stats.turnovers, fouls: p.stats.fouls,
      playing_seconds: p.stats.playingSeconds, plus_minus: p.stats.plusMinus,
    })),
    ...state.awayTeam.players.map((p) => ({
      game_id: dbGameId, player_id: p.id, team_side: 'away',
      player_number: p.number, player_name: p.name,
      points: p.stats.points, fg_made: p.stats.fgMade, fg_attempted: p.stats.fgAttempted,
      three_made: p.stats.threeMade, three_attempted: p.stats.threeAttempted,
      ft_made: p.stats.ftMade, ft_attempted: p.stats.ftAttempted,
      off_rebounds: p.stats.offRebounds, def_rebounds: p.stats.defRebounds,
      assists: p.stats.assists, steals: p.stats.steals, blocks: p.stats.blocks,
      turnovers: p.stats.turnovers, fouls: p.stats.fouls,
      playing_seconds: p.stats.playingSeconds, plus_minus: p.stats.plusMinus,
    })),
  ]

  const { error: statsErr } = await supabase.from('sb_player_stats').insert(playerStats)
  if (statsErr) {
    // Rollback game status
    await supabase.from('sb_games').update({ status: 'pending' }).eq('id', dbGameId)
    return false
  }
  return true
}

export default function ManagementGamePage() {
  const params = useParams()
  const dbGameId = params.id as string

  const [dbGame, setDbGame] = useState<GameRecord | null>(null)
  const [game, setGame] = useState<GameState | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quarterMinutes, setQuarterMinutes] = useState(QUARTER_MINUTES)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load game + players from DB
  useEffect(() => {
    async function load() {
      const { data: gData } = await supabase.from('sb_games').select('*').eq('id', dbGameId).single()
      if (!gData) { setError('找不到此比賽'); setLoading(false); return }
      if (gData.status === 'completed') { setError('此比賽已結束'); setLoading(false); return }
      setDbGame(gData)

      // Load players: try league_rosters first, fallback to sb_players
      const loadSquadPlayers = async (squadId: string, leagueId: string | null) => {
        if (leagueId) {
          const { data: roster } = await supabase
            .from('sb_league_rosters')
            .select('player_id, jersey_number')
            .eq('league_id', leagueId)
            .eq('squad_id', squadId)
          if (roster && roster.length > 0) {
            const playerIds = roster.map((r: { player_id: string }) => r.player_id)
            const { data: playerData } = await supabase.from('sb_players').select('*').in('id', playerIds)
            if (playerData) {
              const jerseyMap = new Map(roster.map((r: { player_id: string; jersey_number: string }) => [r.player_id, r.jersey_number]))
              return playerData.map((p: { id: string; number: string; name: string }) =>
                createPlayer(p.id, jerseyMap.get(p.id) || p.number, p.name)
              )
            }
          }
        }
        // Fallback: all players in squad
        const { data: playerData } = await supabase.from('sb_players').select('*').eq('squad_id', squadId).order('number')
        return (playerData ?? []).map((p: { id: string; number: string; name: string }) =>
          createPlayer(p.id, p.number, p.name)
        )
      }

      const [homePlayers, awayPlayers] = await Promise.all([
        loadSquadPlayers(gData.home_squad_id, gData.league_id),
        loadSquadPlayers(gData.away_squad_id, gData.league_id),
      ])

      if (homePlayers.length === 0 || awayPlayers.length === 0) {
        setError('隊伍沒有球員，請先到隊伍管理新增球員')
        setLoading(false)
        return
      }

      const homeTeam = createTeam('home', gData.home_squad_name, 'gold', homePlayers)
      const awayTeam = createTeam('away', gData.away_squad_name, 'white', awayPlayers)

      setGame({
        homeTeam, awayTeam,
        quarter: 1, isRunning: false, timeRemaining: QUARTER_MINUTES * 60,
        selectedPlayerId: null, selectedTeamId: null,
        substitutingPlayerId: null, substitutingTeamId: null,
      })
      setLoading(false)
    }
    load()
  }, [dbGameId])

  // Timer
  useEffect(() => {
    if (!game?.isRunning) return
    timerRef.current = setInterval(() => {
      setGame((prev) => {
        if (!prev || prev.timeRemaining <= 0) return prev
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
          homeTeam: updateOnCourtPlayers(prev.homeTeam, (s) => ({ ...s, playingSeconds: s.playingSeconds + 1 })),
          awayTeam: updateOnCourtPlayers(prev.awayTeam, (s) => ({ ...s, playingSeconds: s.playingSeconds + 1 })),
        }
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [game?.isRunning])

  const toggleTimer = useCallback(() => {
    setGame((prev) => prev ? { ...prev, isRunning: !prev.isRunning } : prev)
  }, [])

  const resetTimer = useCallback(() => {
    setGame((prev) => prev ? { ...prev, isRunning: false, timeRemaining: quarterMinutes * 60 } : prev)
  }, [quarterMinutes])

  const nextQuarter = useCallback(() => {
    setGame((prev) => {
      if (!prev) return prev
      const next = prev.quarter + 1
      const needsOT = next > 4
      return {
        ...prev, quarter: next, isRunning: false,
        timeRemaining: (needsOT ? 5 : quarterMinutes) * 60,
        homeTeam: needsOT ? { ...prev.homeTeam, quarterScores: [...prev.homeTeam.quarterScores, 0] } : prev.homeTeam,
        awayTeam: needsOT ? { ...prev.awayTeam, quarterScores: [...prev.awayTeam.quarterScores, 0] } : prev.awayTeam,
      }
    })
  }, [quarterMinutes])

  const handleSetQuarterMinutes = useCallback((minutes: number) => {
    setQuarterMinutes(minutes)
    setGame((prev) => prev ? { ...prev, timeRemaining: minutes * 60 } : prev)
  }, [])

  const selectPlayer = useCallback((teamId: string, playerId: string) => {
    setGame((prev) => {
      if (!prev) return prev
      if (prev.substitutingPlayerId && prev.substitutingTeamId === teamId) {
        const team = teamId === 'home' ? prev.homeTeam : prev.awayTeam
        if (!team.onCourtIds.includes(playerId)) {
          const updatedTeam = substitutePlayer(team, prev.substitutingPlayerId, playerId)
          setHistory((h) => [...h, { teamId, playerId, action: 'substitute', quarter: prev.quarter, substituteOutId: prev.substitutingPlayerId! }])
          return {
            ...prev,
            homeTeam: teamId === 'home' ? updatedTeam : prev.homeTeam,
            awayTeam: teamId === 'away' ? updatedTeam : prev.awayTeam,
            substitutingPlayerId: null, substitutingTeamId: null,
            selectedPlayerId: playerId, selectedTeamId: teamId,
          }
        }
      }
      return { ...prev, selectedPlayerId: playerId, selectedTeamId: teamId, substitutingPlayerId: null, substitutingTeamId: null }
    })
  }, [])

  const handleSubstitute = useCallback(() => {
    setGame((prev) => {
      if (!prev?.selectedPlayerId || !prev?.selectedTeamId) return prev
      const team = prev.selectedTeamId === 'home' ? prev.homeTeam : prev.awayTeam
      if (!team.onCourtIds.includes(prev.selectedPlayerId)) return prev
      return { ...prev, substitutingPlayerId: prev.selectedPlayerId, substitutingTeamId: prev.selectedTeamId }
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
      if (!team.players.find((p) => p.id === prev.selectedPlayerId)) return prev

      const updatedTeam = updateTeamPlayer(team, prev.selectedPlayerId, (s) => applyAction(s, action))
      const scorePoints = getScoreFromAction(action)
      const teamWithScore = scorePoints > 0 ? updateQuarterScore(updatedTeam, prev.quarter, scorePoints) : updatedTeam

      let newHome = isHome ? teamWithScore : prev.homeTeam
      let newAway = isHome ? prev.awayTeam : teamWithScore
      if (scorePoints > 0) {
        newHome = updateOnCourtPlayers(newHome, (s) => ({ ...s, plusMinus: s.plusMinus + (isHome ? scorePoints : -scorePoints) }))
        newAway = updateOnCourtPlayers(newAway, (s) => ({ ...s, plusMinus: s.plusMinus + (isHome ? -scorePoints : scorePoints) }))
      }

      const teamId = prev.selectedTeamId
      const playerId = prev.selectedPlayerId
      setHistory((h) => [...h, { teamId, playerId, action, quarter: prev.quarter }])
      return { ...prev, homeTeam: newHome, awayTeam: newAway }
    })
  }, [])

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev.at(-1)!
      if (last.action === 'substitute') {
        setGame((g) => {
          if (!g || !last.substituteOutId) return g
          const isHome = last.teamId === 'home'
          const team = isHome ? g.homeTeam : g.awayTeam
          const reverted = substitutePlayer(team, last.playerId, last.substituteOutId)
          return { ...g, homeTeam: isHome ? reverted : g.homeTeam, awayTeam: isHome ? g.awayTeam : reverted }
        })
      } else {
        setGame((g) => {
          if (!g) return g
          const isHome = last.teamId === 'home'
          const team = isHome ? g.homeTeam : g.awayTeam
          const updatedTeam = updateTeamPlayer(team, last.playerId, (s) => reverseAction(s, last.action as StatAction))
          const scorePoints = getScoreFromAction(last.action as StatAction)
          const teamWithScore = scorePoints > 0 ? updateQuarterScore(updatedTeam, last.quarter, -scorePoints) : updatedTeam
          let newHome = isHome ? teamWithScore : g.homeTeam
          let newAway = isHome ? g.awayTeam : teamWithScore
          if (scorePoints > 0) {
            newHome = updateOnCourtPlayers(newHome, (s) => ({ ...s, plusMinus: s.plusMinus + (isHome ? -scorePoints : scorePoints) }))
            newAway = updateOnCourtPlayers(newAway, (s) => ({ ...s, plusMinus: s.plusMinus + (isHome ? scorePoints : -scorePoints) }))
          }
          return { ...g, homeTeam: newHome, awayTeam: newAway }
        })
      }
      return prev.slice(0, -1)
    })
  }, [])

  // Loading / Error states
  if (loading) {
    return <div className="min-h-screen bg-bn-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
    </div>
  }

  if (error || !game || !dbGame) {
    return (
      <div className="min-h-screen bg-bn-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-bn-slate text-sm mb-4">{error || '發生錯誤'}</p>
          <Link href="/management" className="text-bn-yellow text-sm font-semibold hover:text-bn-gold transition-colors">
            返回賽事管理
          </Link>
        </div>
      </div>
    )
  }

  const selectedPlayer: Player | null = (() => {
    if (!game.selectedPlayerId || !game.selectedTeamId) return null
    const team = game.selectedTeamId === 'home' ? game.homeTeam : game.awayTeam
    return team.players.find((p) => p.id === game.selectedPlayerId) ?? null
  })()

  const selectedIsHome = game.selectedTeamId === 'home'
  const selectedTeam = selectedIsHome ? game.homeTeam : game.awayTeam
  const selectedIsOnCourt = selectedPlayer ? selectedTeam.onCourtIds.includes(selectedPlayer.id) : false

  return (
    <div className="min-h-screen bg-bn-dark">
      <header className="bg-bn-card border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/management" className="text-bn-yellow font-bold text-lg tracking-wider">EMPOWER</Link>
            <span className="text-bn-steel">|</span>
            <span className="text-bn-slate text-sm font-semibold">比賽紀錄</span>
            <span className="text-bn-steel">|</span>
            <span className="text-bn-muted text-xs">{dbGame.game_date} {dbGame.game_time ?? ''}{dbGame.location ? ` @ ${dbGame.location}` : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/management" className="text-bn-muted hover:text-bn-slate text-xs transition-colors">返回管理後台</Link>
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                if (game.isRunning) setGame((prev) => prev ? { ...prev, isRunning: false } : prev)
                const ok = await saveGame(dbGameId, game)
                setSaving(false)
                if (ok) window.location.href = `/games/${dbGameId}`
              }}
              className="px-5 py-1.5 rounded-[50px] text-xs font-bold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors disabled:opacity-40"
            >
              {saving ? '儲存中...' : '結束並儲存'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
        <ScoreboardHeader
          homeTeam={game.homeTeam} awayTeam={game.awayTeam}
          quarter={game.quarter} timeRemaining={game.timeRemaining} isRunning={game.isRunning}
          quarterMinutes={quarterMinutes}
          onToggleTimer={toggleTimer} onNextQuarter={nextQuarter} onResetTimer={resetTimer}
          onSetQuarterMinutes={handleSetQuarterMinutes}
        />
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-4">
            <PlayerStatsTable players={game.homeTeam.players} onCourtIds={game.homeTeam.onCourtIds}
              teamName={game.homeTeam.name} isHome={true}
              selectedPlayerId={game.selectedTeamId === 'home' ? game.selectedPlayerId : null}
              substitutingPlayerId={game.substitutingTeamId === 'home' ? game.substitutingPlayerId : null}
              onSelectPlayer={(id) => selectPlayer('home', id)} />
            <PlayerStatsTable players={game.awayTeam.players} onCourtIds={game.awayTeam.onCourtIds}
              teamName={game.awayTeam.name} isHome={false}
              selectedPlayerId={game.selectedTeamId === 'away' ? game.selectedPlayerId : null}
              substitutingPlayerId={game.substitutingTeamId === 'away' ? game.substitutingPlayerId : null}
              onSelectPlayer={(id) => selectPlayer('away', id)} />
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <GameControls selectedPlayer={selectedPlayer}
              teamName={selectedIsHome ? game.homeTeam.name : game.awayTeam.name}
              isHome={selectedIsHome} isOnCourt={selectedIsOnCourt}
              isSubstituting={!!game.substitutingPlayerId}
              onAction={handleAction} onSubstitute={handleSubstitute}
              onCancelSubstitute={cancelSubstitute} onUndo={handleUndo} canUndo={history.length > 0} />
          </div>
        </div>
      </div>
    </div>
  )
}
