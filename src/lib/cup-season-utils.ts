// Shared cup/season/squad lookup builders used across pages.

interface SeasonLike {
  readonly id: string
  readonly cup_id: string
}

interface SquadLike {
  readonly id: string
  readonly org_id: string
}

interface OrgLike {
  readonly id: string
}

interface GameLike {
  readonly season_id: string | null
}

export function buildSeasonCupMap(seasons: readonly SeasonLike[]): ReadonlyMap<string, string> {
  return new Map(seasons.map((s) => [s.id, s.cup_id]))
}

export function getCupIdForGame(
  game: { readonly season_id: string | null },
  seasonCupMap: ReadonlyMap<string, string>
): string | null {
  if (!game.season_id) return null
  return seasonCupMap.get(game.season_id) ?? null
}

export function buildSquadOrgMap<O extends OrgLike>(
  squads: readonly SquadLike[],
  orgs: readonly O[]
): ReadonlyMap<string, O> {
  const orgMap = new Map(orgs.map((o) => [o.id, o]))
  const map = new Map<string, O>()
  for (const sq of squads) {
    const org = orgMap.get(sq.org_id)
    if (org) map.set(sq.id, org)
  }
  return map
}

export function groupGamesByCup<G extends GameLike>(
  games: readonly G[],
  seasonCupMap: ReadonlyMap<string, string>
): ReadonlyMap<string, readonly G[]> {
  const map = new Map<string, G[]>()
  for (const g of games) {
    const cupId = getCupIdForGame(g, seasonCupMap)
    if (!cupId) continue
    const list = map.get(cupId) ?? []
    list.push(g)
    map.set(cupId, list)
  }
  return map
}
