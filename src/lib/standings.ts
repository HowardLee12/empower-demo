export interface StandingRow {
  readonly squadId: string
  readonly squadName: string
  readonly orgShortName: string
  readonly gamesPlayed: number
  readonly wins: number
  readonly losses: number
  readonly pointsFor: number
  readonly pointsAgainst: number
  readonly winPct: number
  readonly lastFive: readonly ('W' | 'L')[]
}

interface GameForStandings {
  readonly home_squad_id: string
  readonly away_squad_id: string
  readonly home_squad_name: string
  readonly away_squad_name: string
  readonly home_score: number
  readonly away_score: number
  readonly game_date: string
  readonly status: string
  readonly season_id: string | null
}

interface OrgLookup {
  get(squadId: string): { short_name: string } | undefined
}

function headToHeadDiff(
  squadAId: string,
  squadBId: string,
  games: readonly GameForStandings[]
): number {
  // Positive = squadA leads, negative = squadB leads, zero = tied.
  let aWins = 0
  let bWins = 0
  for (const g of games) {
    const isAvsB =
      (g.home_squad_id === squadAId && g.away_squad_id === squadBId) ||
      (g.home_squad_id === squadBId && g.away_squad_id === squadAId)
    if (!isAvsB) continue
    const aIsHome = g.home_squad_id === squadAId
    const aScore = aIsHome ? g.home_score : g.away_score
    const bScore = aIsHome ? g.away_score : g.home_score
    if (aScore > bScore) aWins += 1
    else if (bScore > aScore) bWins += 1
  }
  return aWins - bWins
}

export function calculateStandings(
  games: readonly GameForStandings[],
  seasonId: string | null,
  squadOrgMap: OrgLookup
): readonly StandingRow[] {
  const completed = games.filter(
    (g) => g.status === 'completed' && (seasonId === null || g.season_id === seasonId)
  )

  // Sort by date for last-5 calculation
  const sorted = [...completed].sort((a, b) => a.game_date.localeCompare(b.game_date))

  const map = new Map<string, {
    squadName: string
    orgShortName: string
    wins: number
    losses: number
    pointsFor: number
    pointsAgainst: number
    results: ('W' | 'L')[]
  }>()

  function ensure(squadId: string, squadName: string) {
    if (!map.has(squadId)) {
      const org = squadOrgMap.get(squadId)
      map.set(squadId, {
        squadName,
        orgShortName: org?.short_name ?? squadName.slice(0, 2),
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        results: [],
      })
    }
    return map.get(squadId)!
  }

  for (const g of sorted) {
    const home = ensure(g.home_squad_id, g.home_squad_name)
    const away = ensure(g.away_squad_id, g.away_squad_name)

    home.pointsFor += g.home_score
    home.pointsAgainst += g.away_score
    away.pointsFor += g.away_score
    away.pointsAgainst += g.home_score

    if (g.home_score > g.away_score) {
      home.wins += 1
      home.results.push('W')
      away.losses += 1
      away.results.push('L')
    } else {
      away.wins += 1
      away.results.push('W')
      home.losses += 1
      home.results.push('L')
    }
  }

  const rows: StandingRow[] = []
  for (const [squadId, data] of map.entries()) {
    const gp = data.wins + data.losses
    rows.push({
      squadId,
      squadName: data.squadName,
      orgShortName: data.orgShortName,
      gamesPlayed: gp,
      wins: data.wins,
      losses: data.losses,
      pointsFor: data.pointsFor,
      pointsAgainst: data.pointsAgainst,
      winPct: gp > 0 ? data.wins / gp : 0,
      lastFive: data.results.slice(-5),
    })
  }

  return rows.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct
    const aDiff = a.pointsFor - a.pointsAgainst
    const bDiff = b.pointsFor - b.pointsAgainst
    if (bDiff !== aDiff) return bDiff - aDiff
    // Head-to-head tiebreaker: positive return means b ranks higher than a
    return headToHeadDiff(b.squadId, a.squadId, completed)
  })
}
