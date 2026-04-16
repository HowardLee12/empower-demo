import { Team, PlayerStats } from '@/lib/scoreboard-types'

export type StatAction =
  | 'fg2_made' | 'fg2_miss'
  | 'fg3_made' | 'fg3_miss'
  | 'ft_made' | 'ft_miss'
  | 'off_rebound' | 'def_rebound'
  | 'assist' | 'steal' | 'block' | 'turnover' | 'foul'

export interface HistoryEntry {
  readonly teamId: string
  readonly playerId: string
  readonly action: StatAction | 'substitute'
  readonly quarter: number
  readonly substituteOutId?: string
}

export function applyAction(stats: PlayerStats, action: StatAction): PlayerStats {
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

export function reverseAction(stats: PlayerStats, action: StatAction): PlayerStats {
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

export function getScoreFromAction(action: StatAction): number {
  switch (action) {
    case 'fg2_made': return 2
    case 'fg3_made': return 3
    case 'ft_made': return 1
    default: return 0
  }
}

export function updateTeamPlayer(team: Team, playerId: string, updater: (s: PlayerStats) => PlayerStats): Team {
  return {
    ...team,
    players: team.players.map((p) =>
      p.id === playerId ? { ...p, stats: updater(p.stats) } : p
    ),
  }
}

export function updateOnCourtPlayers(team: Team, updater: (s: PlayerStats) => PlayerStats): Team {
  return {
    ...team,
    players: team.players.map((p) =>
      team.onCourtIds.includes(p.id) ? { ...p, stats: updater(p.stats) } : p
    ),
  }
}

export function updateQuarterScore(team: Team, quarter: number, delta: number): Team {
  return {
    ...team,
    quarterScores: team.quarterScores.map((s, i) =>
      i === quarter - 1 ? s + delta : s
    ),
  }
}

export function substitutePlayer(team: Team, outId: string, inId: string): Team {
  return {
    ...team,
    onCourtIds: team.onCourtIds.map((id) => id === outId ? inId : id),
  }
}
