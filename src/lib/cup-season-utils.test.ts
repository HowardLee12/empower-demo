import { describe, it, expect } from 'vitest'
import { buildSeasonCupMap, getCupIdForGame, buildSquadOrgMap, groupGamesByCup } from './cup-season-utils'

describe('buildSeasonCupMap', () => {
  it('returns empty map when no seasons', () => {
    expect(buildSeasonCupMap([])).toEqual(new Map())
  })

  it('maps season_id to cup_id', () => {
    const map = buildSeasonCupMap([
      { id: 's1', cup_id: 'c1' },
      { id: 's2', cup_id: 'c1' },
      { id: 's3', cup_id: 'c2' },
    ])
    expect(map.get('s1')).toBe('c1')
    expect(map.get('s2')).toBe('c1')
    expect(map.get('s3')).toBe('c2')
    expect(map.get('unknown')).toBeUndefined()
  })
})

describe('getCupIdForGame', () => {
  const seasonCupMap = new Map([['s1', 'c1'], ['s2', 'c2']])

  it('returns null when game has no season_id', () => {
    expect(getCupIdForGame({ season_id: null }, seasonCupMap)).toBeNull()
  })

  it('returns cup_id when season is mapped', () => {
    expect(getCupIdForGame({ season_id: 's1' }, seasonCupMap)).toBe('c1')
  })

  it('returns null when season_id is unknown', () => {
    expect(getCupIdForGame({ season_id: 'missing' }, seasonCupMap)).toBeNull()
  })
})

describe('buildSquadOrgMap', () => {
  it('returns empty when no squads', () => {
    expect(buildSquadOrgMap([], [{ id: 'o1', name: 'Org' }])).toEqual(new Map())
  })

  it('maps squad to its org', () => {
    const squads = [{ id: 'sq1', org_id: 'o1' }, { id: 'sq2', org_id: 'o2' }]
    const orgs = [{ id: 'o1', name: 'Bears' }, { id: 'o2', name: 'Eagles' }]
    const map = buildSquadOrgMap(squads, orgs)
    expect(map.get('sq1')).toEqual({ id: 'o1', name: 'Bears' })
    expect(map.get('sq2')).toEqual({ id: 'o2', name: 'Eagles' })
  })

  it('skips squads whose org is not in the orgs list', () => {
    const squads = [{ id: 'sq1', org_id: 'o1' }, { id: 'sq2', org_id: 'orphan' }]
    const orgs = [{ id: 'o1', name: 'Bears' }]
    const map = buildSquadOrgMap(squads, orgs)
    expect(map.size).toBe(1)
    expect(map.has('sq2')).toBe(false)
  })
})

describe('groupGamesByCup', () => {
  const seasonCupMap = new Map([['s1', 'c1'], ['s2', 'c1'], ['s3', 'c2']])
  const games = [
    { id: 'g1', season_id: 's1' },
    { id: 'g2', season_id: 's2' },
    { id: 'g3', season_id: 's3' },
    { id: 'g4', season_id: null },
    { id: 'g5', season_id: 'unknown' },
  ]

  it('groups games by cup_id, skipping orphans', () => {
    const grouped = groupGamesByCup(games, seasonCupMap)
    expect(grouped.get('c1')?.map((g) => g.id)).toEqual(['g1', 'g2'])
    expect(grouped.get('c2')?.map((g) => g.id)).toEqual(['g3'])
    expect(grouped.has('null')).toBe(false)
  })
})
