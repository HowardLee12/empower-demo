export interface StatLeader {
  readonly category: string
  readonly unit: string
  readonly value: string
  readonly playerName: string
  readonly playerNumber: string
  readonly teamName: string
  readonly orgShortName: string
}

interface PlayerStatRow {
  readonly player_id: string
  readonly player_name: string
  readonly player_number: string
  readonly team_side: string
  readonly points: number
  readonly assists: number
  readonly off_rebounds: number
  readonly def_rebounds: number
  readonly game_id: string
}

interface GameLookup {
  readonly home_squad_name: string
  readonly away_squad_name: string
  readonly home_squad_id: string
  readonly away_squad_id: string
}

interface OrgLookup {
  get(squadId: string): { short_name: string } | undefined
}

const MIN_GAMES = 1

export function calculateStatLeaders(
  stats: readonly PlayerStatRow[],
  gameLookup: ReadonlyMap<string, GameLookup>,
  squadOrgMap: OrgLookup
): readonly StatLeader[] {
  // Group stats by player
  const playerMap = new Map<string, {
    name: string
    number: string
    games: number
    totalPoints: number
    totalAssists: number
    totalRebounds: number
    teamName: string
    orgShortName: string
  }>()

  for (const s of stats) {
    const game = gameLookup.get(s.game_id)
    if (!game) continue

    const squadId = s.team_side === 'home' ? game.home_squad_id : game.away_squad_id
    const teamName = s.team_side === 'home' ? game.home_squad_name : game.away_squad_name
    const org = squadOrgMap.get(squadId)

    const existing = playerMap.get(s.player_id)
    if (existing) {
      playerMap.set(s.player_id, {
        ...existing,
        games: existing.games + 1,
        totalPoints: existing.totalPoints + s.points,
        totalAssists: existing.totalAssists + s.assists,
        totalRebounds: existing.totalRebounds + s.off_rebounds + s.def_rebounds,
      })
    } else {
      playerMap.set(s.player_id, {
        name: s.player_name,
        number: s.player_number,
        games: 1,
        totalPoints: s.points,
        totalAssists: s.assists,
        totalRebounds: s.off_rebounds + s.def_rebounds,
        teamName,
        orgShortName: org?.short_name ?? teamName.slice(0, 2),
      })
    }
  }

  const qualified = [...playerMap.values()].filter((p) => p.games >= MIN_GAMES)
  if (qualified.length === 0) return []

  const leaders: StatLeader[] = []

  // PPG leader — only show if top scorer has > 0 points
  const ppgSorted = [...qualified].sort((a, b) => b.totalPoints / b.games - a.totalPoints / a.games)
  if (ppgSorted.length > 0 && ppgSorted[0].totalPoints > 0) {
    const p = ppgSorted[0]
    leaders.push({
      category: '得分王',
      unit: 'PPG',
      value: (p.totalPoints / p.games).toFixed(1),
      playerName: p.name,
      playerNumber: p.number,
      teamName: p.teamName,
      orgShortName: p.orgShortName,
    })
  }

  // APG leader
  const apgSorted = [...qualified].sort((a, b) => b.totalAssists / b.games - a.totalAssists / a.games)
  if (apgSorted.length > 0 && apgSorted[0].totalAssists > 0) {
    const p = apgSorted[0]
    leaders.push({
      category: '助攻王',
      unit: 'APG',
      value: (p.totalAssists / p.games).toFixed(1),
      playerName: p.name,
      playerNumber: p.number,
      teamName: p.teamName,
      orgShortName: p.orgShortName,
    })
  }

  // RPG leader
  const rpgSorted = [...qualified].sort((a, b) => b.totalRebounds / b.games - a.totalRebounds / a.games)
  if (rpgSorted.length > 0 && rpgSorted[0].totalRebounds > 0) {
    const p = rpgSorted[0]
    leaders.push({
      category: '籃板王',
      unit: 'RPG',
      value: (p.totalRebounds / p.games).toFixed(1),
      playerName: p.name,
      playerNumber: p.number,
      teamName: p.teamName,
      orgShortName: p.orgShortName,
    })
  }

  return leaders
}
