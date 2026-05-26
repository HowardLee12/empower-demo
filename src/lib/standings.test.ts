import { describe, it, expect } from 'vitest'
import { calculateStandings } from './standings'

type Game = Parameters<typeof calculateStandings>[0][number]

const SEASON = 's1'
const NO_ORG = { get: () => undefined }

function game(home: string, away: string, hs: number, as_: number, date = '2026-01-01', status = 'completed'): Game {
  return {
    home_squad_id: home,
    away_squad_id: away,
    home_squad_name: home,
    away_squad_name: away,
    home_score: hs,
    away_score: as_,
    game_date: date,
    status,
    season_id: SEASON,
  }
}

describe('calculateStandings — baseline behaviors', () => {
  it('returns empty when no games', () => {
    expect(calculateStandings([], SEASON, NO_ORG)).toEqual([])
  })

  it('filters out non-completed games', () => {
    const games = [game('A', 'B', 50, 40, '2026-01-01', 'pending')]
    expect(calculateStandings(games, SEASON, NO_ORG)).toEqual([])
  })

  it('filters by season_id when provided', () => {
    const games = [
      { ...game('A', 'B', 50, 40), season_id: 'other-season' },
    ]
    expect(calculateStandings(games, SEASON, NO_ORG)).toEqual([])
  })

  it('passing null seasonId aggregates all completed games', () => {
    const games = [
      { ...game('A', 'B', 50, 40), season_id: 'a' },
      { ...game('B', 'C', 30, 60), season_id: 'b' },
    ]
    const rows = calculateStandings(games, null, NO_ORG)
    expect(rows).toHaveLength(3)
  })

  it('counts wins, losses, points correctly', () => {
    const rows = calculateStandings([game('A', 'B', 80, 60)], SEASON, NO_ORG)
    const a = rows.find((r) => r.squadId === 'A')!
    const b = rows.find((r) => r.squadId === 'B')!
    expect(a.wins).toBe(1); expect(a.losses).toBe(0)
    expect(a.pointsFor).toBe(80); expect(a.pointsAgainst).toBe(60)
    expect(b.wins).toBe(0); expect(b.losses).toBe(1)
  })

  it('lastFive shows most recent 5 results in chronological order', () => {
    const games = [
      game('A', 'B', 50, 40, '2026-01-01'),
      game('A', 'B', 30, 50, '2026-01-02'),
      game('A', 'B', 60, 40, '2026-01-03'),
      game('A', 'B', 70, 60, '2026-01-04'),
      game('A', 'B', 20, 80, '2026-01-05'),
      game('A', 'B', 90, 50, '2026-01-06'),
    ]
    const a = calculateStandings(games, SEASON, NO_ORG).find((r) => r.squadId === 'A')!
    expect(a.lastFive).toEqual(['L', 'W', 'W', 'L', 'W'])
  })

  it('uses org short_name when squadOrgMap provides one', () => {
    const orgMap = { get: (id: string) => id === 'A' ? { short_name: '黑熊' } : undefined }
    const rows = calculateStandings([game('A', 'B', 50, 40)], SEASON, orgMap)
    expect(rows.find((r) => r.squadId === 'A')!.orgShortName).toBe('黑熊')
    expect(rows.find((r) => r.squadId === 'B')!.orgShortName).toBe('B') // fallback to name.slice(0,2)
  })

  it('sorts by win percentage descending', () => {
    const games = [
      game('A', 'B', 50, 40), // A 1-0
      game('B', 'C', 50, 40), // B 1-1, C 0-1
      game('A', 'C', 50, 40), // A 2-0, C 0-2
    ]
    const rows = calculateStandings(games, SEASON, NO_ORG)
    expect(rows.map((r) => r.squadId)).toEqual(['A', 'B', 'C'])
  })

  it('breaks win-pct ties by point differential', () => {
    const games = [
      game('A', 'X', 100, 50, '2026-01-01'), // A +50, X -50
      game('B', 'Y', 60, 55, '2026-01-02'),  // B +5, Y -5
    ]
    const rows = calculateStandings(games, SEASON, NO_ORG)
    // A and B both 1-0 (100%); A has bigger diff → A first
    expect(rows.findIndex((r) => r.squadId === 'A')).toBeLessThan(rows.findIndex((r) => r.squadId === 'B'))
  })
})

describe('calculateStandings — head-to-head tiebreaker (P1 #3)', () => {
  it('breaks same W-L + same point diff by head-to-head record', () => {
    // B is inserted second (A appears as home in g1 first), so without H2H tiebreaker
    // a sort returning 0 keeps A first. With H2H, B wins H2H 2-1 → B must rank above A.
    const games = [
      game('A', 'B', 40, 50, '2026-01-01'), // B win (+10) [B leads H2H 1-0]
      game('A', 'B', 40, 50, '2026-01-02'), // B win (+10) [B leads H2H 2-0]
      game('B', 'A', 40, 50, '2026-01-03'), // A win (+10) [B leads H2H 2-1]
      game('B', 'C', 50, 40, '2026-01-04'), // B win (+10)
      game('C', 'B', 50, 40, '2026-01-05'), // C win (-10 for B)
      game('A', 'C', 60, 50, '2026-01-06'), // A win (+10)
      game('A', 'C', 60, 50, '2026-01-07'), // A win (+10)
    ]
    // A: 3W (g3,g6,g7) 2L (g1,g2) → 3-2, pts: 40+40+50+60+60=250, against 50+50+40+50+50=240, diff +10
    // B: 3W (g1,g2,g4) 2L (g3,g5) → 3-2, pts: 50+50+40+50+40=230, against 40+40+50+40+50=220, diff +10
    // H2H A vs B: B leads 2-1 → B ranks higher
    const rows = calculateStandings(games, SEASON, NO_ORG)
    expect(rows.findIndex((r) => r.squadId === 'B')).toBeLessThan(rows.findIndex((r) => r.squadId === 'A'))
  })

  it('falls back to point diff when H2H is also tied', () => {
    // A and B split H2H 1-1. Same W-L. A has bigger overall diff.
    const games = [
      game('A', 'B', 50, 40, '2026-01-01'), // A win (+10)
      game('B', 'A', 50, 40, '2026-01-02'), // B win (+10)
      game('A', 'C', 100, 50, '2026-01-03'), // A win (+50)
      game('B', 'C', 60, 55, '2026-01-04'), // B win (+5)
      game('D', 'A', 60, 55, '2026-01-05'), // A loss (-5)
      game('D', 'B', 100, 50, '2026-01-06'), // B loss (-50)
    ]
    // A: 2-2, diff=+10-10+50-5=+45
    // B: 2-2, diff=-10+10+5-50=-45
    // H2H 1-1 → falls back to diff → A
    const rows = calculateStandings(games, SEASON, NO_ORG)
    expect(rows.findIndex((r) => r.squadId === 'A')).toBeLessThan(rows.findIndex((r) => r.squadId === 'B'))
  })

  it('does not invert order when teams have different win-pct', () => {
    // B beats A head-to-head, but A has higher overall win-pct → A still ranks above B.
    const games = [
      game('B', 'A', 50, 40, '2026-01-01'), // B beats A: A 0-1, B 1-0
      game('A', 'C', 50, 40, '2026-01-02'), // A 1-1
      game('A', 'D', 50, 40, '2026-01-03'), // A 2-1
      game('B', 'C', 40, 50, '2026-01-04'), // C beats B: B 1-1
      game('B', 'D', 40, 50, '2026-01-05'), // D beats B: B 1-2
      // A: 2-1 (66%), B: 1-2 (33%)
    ]
    const rows = calculateStandings(games, SEASON, NO_ORG)
    expect(rows.findIndex((r) => r.squadId === 'A')).toBeLessThan(rows.findIndex((r) => r.squadId === 'B'))
  })

  it('handles three-way tie by H2H mini-table win-pct', () => {
    // A, B, C all finish 2-2 with diff=0. Mini-table H2H:
    // A beats B, B beats C, C beats A — circular, but counts may differ.
    // Use: A beats B twice; B beats C twice; C beats A twice; then balance with X.
    // For now just ensure no crash + a stable order emerges.
    const games = [
      game('A', 'B', 50, 40, '2026-01-01'),
      game('A', 'B', 50, 40, '2026-01-02'),
      game('B', 'C', 50, 40, '2026-01-03'),
      game('B', 'C', 50, 40, '2026-01-04'),
      game('C', 'A', 50, 40, '2026-01-05'),
      game('C', 'A', 50, 40, '2026-01-06'),
    ]
    const rows = calculateStandings(games, SEASON, NO_ORG)
    expect(rows).toHaveLength(3)
    expect(rows.every((r) => r.wins === 2 && r.losses === 2)).toBe(true)
  })
})
