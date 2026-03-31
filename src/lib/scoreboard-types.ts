export interface Player {
  readonly id: string
  readonly number: string
  readonly name: string
  readonly stats: PlayerStats
}

export interface PlayerStats {
  readonly points: number
  readonly fgMade: number
  readonly fgAttempted: number
  readonly threeMade: number
  readonly threeAttempted: number
  readonly ftMade: number
  readonly ftAttempted: number
  readonly offRebounds: number
  readonly defRebounds: number
  readonly assists: number
  readonly steals: number
  readonly blocks: number
  readonly turnovers: number
  readonly fouls: number
}

export interface Team {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly players: readonly Player[]
  readonly quarterScores: readonly number[]
}

export interface GameState {
  readonly homeTeam: Team
  readonly awayTeam: Team
  readonly quarter: number
  readonly isRunning: boolean
  readonly timeRemaining: number
  readonly selectedPlayerId: string | null
  readonly selectedTeamId: string | null
}

export const EMPTY_STATS: PlayerStats = {
  points: 0,
  fgMade: 0,
  fgAttempted: 0,
  threeMade: 0,
  threeAttempted: 0,
  ftMade: 0,
  ftAttempted: 0,
  offRebounds: 0,
  defRebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
}

export const QUARTER_MINUTES = 10
export const MAX_QUARTERS = 4

export function createPlayer(id: string, number: string, name: string): Player {
  return { id, number, name, stats: EMPTY_STATS }
}

export function createTeam(id: string, name: string, color: string, players: readonly Player[]): Team {
  return {
    id,
    name,
    color,
    players,
    quarterScores: [0, 0, 0, 0],
  }
}

export function totalScore(team: Team): number {
  return team.quarterScores.reduce((sum, q) => sum + q, 0)
}

export function totalRebounds(stats: PlayerStats): number {
  return stats.offRebounds + stats.defRebounds
}

export function fgPercent(stats: PlayerStats): string {
  if (stats.fgAttempted === 0) return '-'
  return `${Math.round((stats.fgMade / stats.fgAttempted) * 100)}%`
}

export function threePercent(stats: PlayerStats): string {
  if (stats.threeAttempted === 0) return '-'
  return `${Math.round((stats.threeMade / stats.threeAttempted) * 100)}%`
}

export function ftPercent(stats: PlayerStats): string {
  if (stats.ftAttempted === 0) return '-'
  return `${Math.round((stats.ftMade / stats.ftAttempted) * 100)}%`
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
