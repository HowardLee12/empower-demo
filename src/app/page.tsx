'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { MatchCard } from '@/components/MatchCard'
import { WeekSelector } from '@/components/WeekSelector'
import { StatusChips, type StatusFilter } from '@/components/StatusChips'
import { HeroPanel } from '@/components/HeroPanel'
import { FeaturedGameCard } from '@/components/FeaturedGameCard'
import { StandingsTable } from '@/components/StandingsTable'
import { StatLeaders } from '@/components/StatLeaders'
import { calculateStandings } from '@/lib/standings'
import { calculateStatLeaders } from '@/lib/stat-leaders'
import { buildSeasonCupMap, buildSquadOrgMap, getCupIdForGame } from '@/lib/cup-season-utils'

interface GameRecord {
  id: string
  home_squad_id: string
  away_squad_id: string
  home_squad_name: string
  away_squad_name: string
  home_score: number
  away_score: number
  game_date: string
  game_time: string | null
  location: string
  status: string
  season_id: string | null
}

interface Cup {
  id: string
  name: string
  region: string
  type: string
}

interface Season {
  id: string
  cup_id: string
  name: string
  year: number | null
  is_homepage: boolean
}

interface OrgInfo {
  id: string
  short_name: string
  logo_url?: string
}

interface SquadOrg {
  id: string
  org_id: string
}

interface PlayerStatRow {
  player_id: string
  player_name: string
  player_number: string
  team_side: string
  points: number
  assists: number
  off_rebounds: number
  def_rebounds: number
  game_id: string
}

const WEEKDAYS_ZH: Record<string, string> = {
  Mon: '週一', Tue: '週二', Wed: '週三', Thu: '週四',
  Fri: '週五', Sat: '週六', Sun: '週日',
}

function getWeekRange(offset: number): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: toDateStr(monday),
    end: toDateStr(sunday),
  }
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDayHeader(dateStr: string): { weekday: string; display: string; gameCount?: number } {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
  const weekday = WEEKDAYS_ZH[dayName] ?? dayName
  const month = d.getMonth() + 1
  const date = d.getDate()
  return { weekday, display: `${month}月${date}日` }
}

const CUP_DOTS = [
  '#F0B90B', '#0EA5E9', '#A855F7', '#0ECB81',
  '#F6465D', '#D0980B', '#64748B', '#EC4899',
]

export default function Home() {
  const [games, setGames] = useState<GameRecord[]>([])
  const [cups, setCups] = useState<Cup[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [orgs, setOrgs] = useState<OrgInfo[]>([])
  const [squadOrgs, setSquadOrgs] = useState<SquadOrg[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedCupId, setSelectedCupId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [playerStats, setPlayerStats] = useState<PlayerStatRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Phase 1: load core data in parallel (no player stats yet)
      const [gRes, cRes, ssRes, oRes, sRes] = await Promise.all([
        supabase.from('sb_games').select('*').order('game_date', { ascending: true }),
        supabase.from('sb_cups').select('id,name,region,type').order('name'),
        supabase.from('sb_seasons').select('*').order('year', { ascending: false }),
        supabase.from('sb_organizations').select('id, short_name, logo_url'),
        supabase.from('sb_squads').select('id, org_id'),
      ])
      if (gRes.data) setGames(gRes.data)
      if (cRes.data) setCups(cRes.data)
      if (ssRes.data) setSeasons(ssRes.data)
      if (oRes.data) setOrgs(oRes.data)
      if (sRes.data) setSquadOrgs(sRes.data)

      // Phase 2: load only player stats for homepage-season completed games.
      // Avoids fetching every stat row in the DB as the dataset grows.
      const homepageSeasonIds = new Set((ssRes.data ?? []).filter((s) => s.is_homepage).map((s) => s.id))
      const relevantGameIds = (gRes.data ?? [])
        .filter((g) => g.status === 'completed' && g.season_id && homepageSeasonIds.has(g.season_id))
        .map((g) => g.id)
      if (relevantGameIds.length > 0) {
        const psRes = await supabase
          .from('sb_player_stats')
          .select('player_id, player_name, player_number, team_side, points, assists, off_rebounds, def_rebounds, game_id')
          .in('game_id', relevantGameIds)
        if (psRes.data) setPlayerStats(psRes.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const squadOrgMap = useMemo(() => buildSquadOrgMap(squadOrgs, orgs), [orgs, squadOrgs])
  const seasonCupMap = useMemo(() => buildSeasonCupMap(seasons), [seasons])

  const cupDotMap = useMemo(() => {
    const map = new Map<string, string>()
    cups.forEach((c, i) => map.set(c.id, CUP_DOTS[i % CUP_DOTS.length]))
    return map
  }, [cups])

  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset])

  const gameCupId = (g: GameRecord): string | null => getCupIdForGame(g, seasonCupMap)

  // Filter: week → cup → status
  const filteredGames = useMemo(() => {
    let result = games.filter(
      (g) => g.game_date >= weekRange.start && g.game_date <= weekRange.end
    )
    if (selectedCupId) {
      result = result.filter((g) => gameCupId(g) === selectedCupId)
    }
    if (statusFilter === 'LIVE') result = result.filter((g) => g.status === 'live')
    else if (statusFilter === 'UPCOMING') result = result.filter((g) => g.status === 'pending')
    else if (statusFilter === 'FINAL') result = result.filter((g) => g.status === 'completed')
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, weekRange, selectedCupId, statusFilter, seasonCupMap])

  const statusCounts = useMemo(() => {
    let inScope = games.filter(
      (g) => g.game_date >= weekRange.start && g.game_date <= weekRange.end
    )
    if (selectedCupId) {
      inScope = inScope.filter((g) => gameCupId(g) === selectedCupId)
    }
    return {
      all: inScope.length,
      live: inScope.filter((g) => g.status === 'live').length,
      upcoming: inScope.filter((g) => g.status === 'pending').length,
      final: inScope.filter((g) => g.status === 'completed').length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, weekRange, selectedCupId, seasonCupMap])

  const heroStats = useMemo(() => {
    const liveCount = games.filter((g) => g.status === 'live').length
    const upcomingCount = games.filter((g) => g.status === 'pending').length
    const squadIds = new Set<string>()
    for (const g of games) {
      squadIds.add(g.home_squad_id)
      squadIds.add(g.away_squad_id)
    }
    return { liveCount, upcomingCount, teamCount: squadIds.size }
  }, [games])

  const featuredGame = useMemo(() => {
    const todayStr = toDateStr(new Date())
    const live = games.find((g) => g.status === 'live')
    if (live) return live
    const upcoming = games
      .filter((g) => g.status === 'pending' && g.game_date >= todayStr)
      .sort((a, b) => a.game_date.localeCompare(b.game_date) || (a.game_time ?? '').localeCompare(b.game_time ?? ''))
    if (upcoming.length > 0) return upcoming[0]
    const completed = games
      .filter((g) => g.status === 'completed')
      .sort((a, b) => b.game_date.localeCompare(a.game_date))
    return completed[0] ?? null
  }, [games])

  // Standings per (cup, homepage-season)
  const standingsByHomepageSeason = useMemo(() => {
    const homepageSeasons = seasons.filter((s) => s.is_homepage)
    return homepageSeasons.map((s) => {
      const cup = cups.find((c) => c.id === s.cup_id)
      if (!cup) return null
      const seasonGames = games.filter((g) => g.season_id === s.id && g.status === 'completed')
      if (seasonGames.length === 0) return null
      return {
        cup,
        season: s,
        rows: calculateStandings(seasonGames, s.id, squadOrgMap),
      }
    }).filter((e): e is NonNullable<typeof e> => e !== null)
  }, [games, cups, seasons, squadOrgMap])

  const gameLookupMap = useMemo(() => {
    const map = new Map<string, GameRecord>()
    for (const g of games) map.set(g.id, g)
    return map
  }, [games])

  const leadersByHomepageSeason = useMemo(() => {
    const homepageSeasons = seasons.filter((s) => s.is_homepage)
    return homepageSeasons.map((s) => {
      const cup = cups.find((c) => c.id === s.cup_id)
      if (!cup) return null
      const seasonGameIds = new Set(
        games.filter((g) => g.season_id === s.id && g.status === 'completed').map((g) => g.id)
      )
      if (seasonGameIds.size === 0) return null
      const seasonStats = playerStats.filter((s2) => seasonGameIds.has(s2.game_id))
      return {
        cup,
        season: s,
        leaders: calculateStatLeaders(seasonStats, gameLookupMap, squadOrgMap),
      }
    }).filter((e): e is NonNullable<typeof e> => e !== null && e.leaders.length > 0)
  }, [games, cups, seasons, playerStats, gameLookupMap, squadOrgMap])

  const dayGroups = useMemo(() => {
    const map = new Map<string, GameRecord[]>()
    for (const g of filteredGames) {
      const list = map.get(g.game_date) ?? []
      map.set(g.game_date, [...list, g])
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredGames])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HeroPanel
              liveCount={heroStats.liveCount}
              upcomingCount={heroStats.upcomingCount}
              teamCount={heroStats.teamCount}
            />
            {featuredGame && (() => {
              const featuredCupId = gameCupId(featuredGame)
              const featuredCup = featuredCupId ? cups.find((c) => c.id === featuredCupId) : null
              return (
                <FeaturedGameCard
                  game={featuredGame}
                  leagueName={featuredCup?.name}
                  leagueDot={featuredCupId ? cupDotMap.get(featuredCupId) : undefined}
                  homeOrg={squadOrgMap.get(featuredGame.home_squad_id)}
                  awayOrg={squadOrgMap.get(featuredGame.away_squad_id)}
                />
              )
            })()}
          </div>
        </div>
      </div>

      {/* Cup Tabs */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCupId(null)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all inline-flex items-center gap-2 ${
              !selectedCupId
                ? 'bg-bn-ink text-white border border-bn-ink'
                : 'bg-white text-bn-slate border border-bn-border hover:text-bn-ink hover:border-bn-dark/20'
            }`}
          >
            全部賽事
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              !selectedCupId ? 'bg-white/15 text-white' : 'bg-black/5 text-bn-slate'
            }`}>
              {games.length}
            </span>
          </button>
          {cups.map((cup, i) => {
            const count = games.filter((g) => gameCupId(g) === cup.id).length
            const isActive = selectedCupId === cup.id
            const dot = CUP_DOTS[i % CUP_DOTS.length]
            return (
              <button
                key={cup.id}
                onClick={() => setSelectedCupId(isActive ? null : cup.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all inline-flex items-center gap-2 ${
                  isActive
                    ? 'bg-bn-ink text-white border border-bn-ink'
                    : 'bg-white text-bn-slate border border-bn-border hover:text-bn-ink hover:border-bn-dark/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                {cup.name}
                {count > 0 && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    isActive ? 'bg-white/15 text-white' : 'bg-black/5 text-bn-slate'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-5">
          <WeekSelector weekOffset={weekOffset} onChangeWeek={setWeekOffset} />
          <StatusChips value={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
        </div>
      </div>

      {/* Day Groups + Match Cards */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-8">
        {dayGroups.length === 0 ? (
          <div className="rounded-[16px] bg-white border border-bn-border p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAFAF7] mx-auto mb-4 flex items-center justify-center">
              <img src="/empower-logo.svg" alt="" className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-bn-slate text-sm font-medium">本週無賽事</p>
            <p className="text-bn-border text-xs mt-1">No games scheduled for this week</p>
          </div>
        ) : (
          dayGroups.map(([dateStr, dayGames]) => {
            const header = formatDayHeader(dateStr)
            return (
              <div key={dateStr} className="mb-7">
                <div className="flex items-baseline gap-3.5 mb-3 px-1">
                  <span className="text-sm font-semibold text-bn-ink tracking-tight">{header.weekday}</span>
                  <span className="text-xs text-bn-slate">{header.display}</span>
                  <span className="ml-auto text-[11px] text-bn-slate font-medium">
                    {dayGames.length} {dayGames.length === 1 ? 'game' : 'games'}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayGames.map((g) => {
                    const cupId = gameCupId(g)
                    const cup = cupId ? cups.find((c) => c.id === cupId) : null
                    return (
                      <MatchCard
                        key={g.id}
                        game={g}
                        leagueName={cup?.name}
                        leagueDot={cupId ? cupDotMap.get(cupId) : undefined}
                        homeOrg={squadOrgMap.get(g.home_squad_id)}
                        awayOrg={squadOrgMap.get(g.away_squad_id)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Standings & Stat Leaders — per homepage season */}
      {standingsByHomepageSeason.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-12">
          <h2 className="text-[28px] font-semibold tracking-tight text-bn-ink mb-6">排名與數據</h2>
          {standingsByHomepageSeason.map(({ cup, season, rows }) => {
            const cupLeaders = leadersByHomepageSeason.find((e) => e.cup.id === cup.id && e.season.id === season.id)
            return (
              <div key={season.id} className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cupDotMap.get(cup.id) }}
                  />
                  <h3 className="text-lg font-semibold tracking-tight text-bn-ink">{cup.name}</h3>
                  <span className="text-xs text-bn-slate font-medium bg-bn-snow px-2 py-0.5 rounded">{season.name}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
                  <StandingsTable rows={rows} />
                  {cupLeaders && <StatLeaders leaders={cupLeaders.leaders} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
