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
  league_id: string | null
  season: string
}

interface League {
  id: string
  name: string
  region: string
  season: string
  show_on_homepage: boolean
  homepage_season: string
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

// --- Week helpers ---


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

// League color dots
const LEAGUE_DOTS = [
  '#F0B90B', '#0EA5E9', '#A855F7', '#0ECB81',
  '#F6465D', '#D0980B', '#64748B', '#EC4899',
]

export default function Home() {
  const [games, setGames] = useState<GameRecord[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [orgs, setOrgs] = useState<OrgInfo[]>([])
  const [squadOrgs, setSquadOrgs] = useState<SquadOrg[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [playerStats, setPlayerStats] = useState<PlayerStatRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [gRes, lRes, oRes, sRes, psRes] = await Promise.all([
        supabase.from('sb_games').select('*').order('game_date', { ascending: true }),
        supabase.from('sb_leagues').select('*').eq('is_active', true).order('region'),
        supabase.from('sb_organizations').select('id, short_name, logo_url'),
        supabase.from('sb_squads').select('id, org_id'),
        supabase.from('sb_player_stats').select('player_id, player_name, player_number, team_side, points, assists, off_rebounds, def_rebounds, game_id'),
      ])
      if (gRes.data) setGames(gRes.data)
      if (lRes.data) setLeagues(lRes.data)
      if (oRes.data) setOrgs(oRes.data)
      if (sRes.data) setSquadOrgs(sRes.data)
      if (psRes.data) setPlayerStats(psRes.data)
      setLoading(false)
    }
    load()
  }, [])

  // Build org lookup: squadId → OrgInfo
  const squadOrgMap = useMemo(() => {
    const orgMap = new Map(orgs.map((o) => [o.id, o]))
    const map = new Map<string, OrgInfo>()
    for (const sq of squadOrgs) {
      const org = orgMap.get(sq.org_id)
      if (org) map.set(sq.id, org)
    }
    return map
  }, [orgs, squadOrgs])

  // League dot colors
  const leagueDotMap = useMemo(() => {
    const map = new Map<string, string>()
    leagues.forEach((l, i) => map.set(l.id, LEAGUE_DOTS[i % LEAGUE_DOTS.length]))
    return map
  }, [leagues])

  // Week range
  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset])

  // Filter: week → league → status
  const filteredGames = useMemo(() => {
    let result = games.filter(
      (g) => g.game_date >= weekRange.start && g.game_date <= weekRange.end
    )
    if (selectedLeagueId) {
      result = result.filter((g) => g.league_id === selectedLeagueId)
    }
    if (statusFilter === 'LIVE') result = result.filter((g) => g.status === 'live')
    else if (statusFilter === 'UPCOMING') result = result.filter((g) => g.status === 'pending')
    else if (statusFilter === 'FINAL') result = result.filter((g) => g.status === 'completed')
    return result
  }, [games, weekRange, selectedLeagueId, statusFilter])

  // Status counts (within current week + league filter)
  const statusCounts = useMemo(() => {
    let inScope = games.filter(
      (g) => g.game_date >= weekRange.start && g.game_date <= weekRange.end
    )
    if (selectedLeagueId) {
      inScope = inScope.filter((g) => g.league_id === selectedLeagueId)
    }
    return {
      all: inScope.length,
      live: inScope.filter((g) => g.status === 'live').length,
      upcoming: inScope.filter((g) => g.status === 'pending').length,
      final: inScope.filter((g) => g.status === 'completed').length,
    }
  }, [games, weekRange, selectedLeagueId])

  // Hero stats
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

  // Featured game: live > today's upcoming > most recent completed
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

  // Standings per league (filtered by each league's homepage_season)
  const standingsByLeague = useMemo(() => {
    const eligible = leagues.filter((l) => l.show_on_homepage && l.homepage_season)
    return eligible.map((l) => {
      const seasonGames = games.filter(
        (g) => g.league_id === l.id && g.season === l.homepage_season && g.status === 'completed'
      )
      if (seasonGames.length === 0) return null
      return {
        league: l,
        rows: calculateStandings(seasonGames, l.id, squadOrgMap),
      }
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  }, [games, leagues, squadOrgMap])

  // Stat leaders per league
  const gameLookupMap = useMemo(() => {
    const map = new Map<string, GameRecord>()
    for (const g of games) map.set(g.id, g)
    return map
  }, [games])

  const leadersByLeague = useMemo(() => {
    const eligible = leagues.filter((l) => l.show_on_homepage && l.homepage_season)
    return eligible.map((l) => {
      const leagueGameIds = new Set(
        games.filter((g) => g.league_id === l.id && g.season === l.homepage_season && g.status === 'completed').map((g) => g.id)
      )
      if (leagueGameIds.size === 0) return null
      const leagueStats = playerStats.filter((s) => leagueGameIds.has(s.game_id))
      return {
        league: l,
        leaders: calculateStatLeaders(leagueStats, gameLookupMap, squadOrgMap),
      }
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null && entry.leaders.length > 0)
  }, [games, leagues, playerStats, gameLookupMap, squadOrgMap])

  // Group by day
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
            {featuredGame && (
              <FeaturedGameCard
                game={featuredGame}
                leagueName={leagues.find((l) => l.id === featuredGame.league_id)?.name}
                leagueDot={featuredGame.league_id ? leagueDotMap.get(featuredGame.league_id) : undefined}
                homeOrg={squadOrgMap.get(featuredGame.home_squad_id)}
                awayOrg={squadOrgMap.get(featuredGame.away_squad_id)}
              />
            )}
          </div>
        </div>
      </div>

      {/* League Tabs */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedLeagueId(null)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all inline-flex items-center gap-2 ${
              !selectedLeagueId
                ? 'bg-bn-ink text-white border border-bn-ink'
                : 'bg-white text-bn-slate border border-bn-border hover:text-bn-ink hover:border-bn-dark/20'
            }`}
          >
            全部賽事
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              !selectedLeagueId ? 'bg-white/15 text-white' : 'bg-black/5 text-bn-slate'
            }`}>
              {games.length}
            </span>
          </button>
          {leagues.map((league, i) => {
            const count = games.filter((g) => g.league_id === league.id).length
            const isActive = selectedLeagueId === league.id
            const dot = LEAGUE_DOTS[i % LEAGUE_DOTS.length]
            return (
              <button
                key={league.id}
                onClick={() => setSelectedLeagueId(isActive ? null : league.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all inline-flex items-center gap-2 ${
                  isActive
                    ? 'bg-bn-ink text-white border border-bn-ink'
                    : 'bg-white text-bn-slate border border-bn-border hover:text-bn-ink hover:border-bn-dark/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                {league.name}
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

      {/* Filters: Week + Status */}
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
                {/* Day header */}
                <div className="flex items-baseline gap-3.5 mb-3 px-1">
                  <span className="text-sm font-semibold text-bn-ink tracking-tight">{header.weekday}</span>
                  <span className="text-xs text-bn-slate">{header.display}</span>
                  <span className="ml-auto text-[11px] text-bn-slate font-medium">
                    {dayGames.length} {dayGames.length === 1 ? 'game' : 'games'}
                  </span>
                </div>
                {/* Cards */}
                <div className="space-y-2">
                  {dayGames.map((g) => {
                    const league = leagues.find((l) => l.id === g.league_id)
                    return (
                      <MatchCard
                        key={g.id}
                        game={g}
                        leagueName={league?.name}
                        leagueDot={g.league_id ? leagueDotMap.get(g.league_id) : undefined}
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

      {/* Standings & Stat Leaders — per league */}
      {standingsByLeague.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-12">
          <h2 className="text-[28px] font-semibold tracking-tight text-bn-ink mb-6">排名與數據</h2>
          {standingsByLeague.map(({ league, rows }) => {
            const leagueLeaders = leadersByLeague.find((e) => e.league.id === league.id)
            return (
              <div key={league.id} className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: leagueDotMap.get(league.id) }}
                  />
                  <h3 className="text-lg font-semibold tracking-tight text-bn-ink">{league.name}</h3>
                  {league.homepage_season && (
                    <span className="text-xs text-bn-slate font-medium bg-bn-snow px-2 py-0.5 rounded">{league.homepage_season}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
                  <StandingsTable rows={rows} />
                  {leagueLeaders && <StatLeaders leaders={leagueLeaders.leaders} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
