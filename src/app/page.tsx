'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Calendar } from '@/components/Calendar'

interface GameRecord {
  id: string
  home_squad_name: string
  away_squad_name: string
  home_score: number
  away_score: number
  game_date: string
  game_time: string | null
  location: string
  status: string
  league_id: string | null
}

interface League {
  id: string
  name: string
  region: string
  season: string
  is_active: boolean
}

export default function Home() {
  const [games, setGames] = useState<GameRecord[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [gRes, lRes] = await Promise.all([
        supabase.from('sb_games').select('*').order('game_date', { ascending: true }),
        supabase.from('sb_leagues').select('*').eq('is_active', true).order('region'),
      ])
      if (gRes.data) setGames(gRes.data)
      if (lRes.data) setLeagues(lRes.data)
      setLoading(false)
    }
    load()
  }, [])

  // All unique dates that have games
  const gameDates = useMemo(() => new Set(games.map((g) => g.game_date)), [games])

  // Games for the selected date
  const dailyGames = useMemo(
    () => games.filter((g) => g.game_date === selectedDate),
    [games, selectedDate]
  )

  // Unique regions for tabs
  const regions = useMemo(() => {
    const set = new Set(leagues.map((l) => l.region))
    return ['所有聯盟', ...set]
  }, [leagues])

  // Filtered leagues
  const filteredLeagues = useMemo(() => {
    if (!selectedRegion || selectedRegion === '所有聯盟') return leagues
    return leagues.filter((l) => l.region === selectedRegion)
  }, [leagues, selectedRegion])

  // Count games per league
  const leagueGameCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of games) {
      if (g.league_id) map.set(g.league_id, (map.get(g.league_id) ?? 0) + 1)
    }
    return map
  }, [games])

  if (loading) {
    return (
      <div className="min-h-screen bg-bn-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bn-dark">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-bn-yellow pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-bn-ink">
            EMPOWER LEAGUE
          </h1>
        </div>
      </div>

      {/* Calendar + Daily Games */}
      <section className="bg-white border-b border-bn-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            {/* Calendar */}
            <div>
              <Calendar
                selectedDate={selectedDate}
                gameDates={gameDates}
                onSelectDate={setSelectedDate}
              />
            </div>

            {/* Daily games */}
            <div>
              <h2 className="text-bn-ink font-bold text-lg mb-4">
                {selectedDate === new Date().toISOString().split('T')[0] ? '本日賽事' : `${selectedDate} 賽事`}
              </h2>
              {dailyGames.length === 0 ? (
                <div className="rounded-[12px] bg-bn-snow border border-bn-border p-8 text-center">
                  <p className="text-bn-slate text-sm">No Event Today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyGames.map((g) => {
                    const isCompleted = g.status === 'completed'
                    const homeWin = g.home_score > g.away_score
                    const awayWin = g.away_score > g.home_score
                    const leagueName = leagues.find((l) => l.id === g.league_id)?.name

                    return (
                      <div
                        key={g.id}
                        className="rounded-[12px] bg-white border border-bn-border p-4 shadow-[rgba(32,32,37,0.05)_0px_3px_5px] hover:shadow-[rgba(8,8,8,0.05)_0px_3px_5px_5px] transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {g.game_time && <span className="text-bn-ink text-xs font-semibold">{g.game_time}</span>}
                            {g.location && <span className="text-bn-slate text-xs">{g.location}</span>}
                          </div>
                          {leagueName && <span className="text-bn-muted text-[11px]">{leagueName}</span>}
                          {isCompleted && (
                            <span className="text-bn-slate text-[10px] font-bold tracking-wider">FINAL</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`font-semibold text-sm ${isCompleted && homeWin ? 'text-bn-ink' : 'text-bn-secondary'}`}>
                              {g.home_squad_name}
                            </span>
                            {isCompleted && homeWin && (
                              <span className="text-bn-green text-[10px] font-bold">勝</span>
                            )}
                          </div>
                          {isCompleted ? (
                            <Link
                              href={`/scoreboard/games/${g.id}`}
                              className="flex items-center gap-2 px-4"
                            >
                              <span className={`text-xl font-bold tabular-nums ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_score}</span>
                              <span className="text-bn-border mx-1">-</span>
                              <span className={`text-xl font-bold tabular-nums ${awayWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_score}</span>
                            </Link>
                          ) : (
                            <span className="text-bn-yellow text-xs font-semibold px-4">即將開始</span>
                          )}
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            {isCompleted && awayWin && (
                              <span className="text-bn-green text-[10px] font-bold">勝</span>
                            )}
                            <span className={`font-semibold text-sm ${isCompleted && awayWin ? 'text-bn-ink' : 'text-bn-secondary'}`}>
                              {g.away_squad_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Leagues Section */}
      <section className="bg-white py-12 border-b border-bn-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-[34px] font-bold text-bn-ink text-center mb-2">EMPOWER LEAGUES</h2>
          <p className="text-bn-slate text-center mb-8">聯盟清單</p>
          <hr className="border-bn-ink w-16 mx-auto mb-8" />

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {regions.map((r) => {
              const isActive = (!selectedRegion && r === '所有聯盟') || selectedRegion === r
              const count = r === '所有聯盟'
                ? leagues.length
                : leagues.filter((l) => l.region === r).length
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r === '所有聯盟' ? null : r)}
                  className={`px-4 py-2 rounded-[6px] text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-bn-yellow text-bn-ink'
                      : 'bg-bn-snow text-bn-secondary hover:bg-bn-border/60'
                  }`}
                >
                  {r}
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-bn-ink/60' : 'text-bn-slate'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* League Grid */}
          {filteredLeagues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-bn-slate text-sm">尚未建立聯盟</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeagues.map((league) => {
                const gameCount = leagueGameCounts.get(league.id) ?? 0
                return (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className="block rounded-[12px] bg-white border border-bn-border p-5 shadow-[rgba(32,32,37,0.05)_0px_3px_5px] hover:shadow-[rgba(8,8,8,0.05)_0px_3px_5px_5px] hover:border-bn-yellow/30 transition-all"
                  >
                    <h3 className="text-bn-ink font-semibold text-base mb-1">{league.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-bn-slate text-xs">{league.region}</span>
                      <span className="text-bn-border">|</span>
                      <span className="text-bn-slate text-xs">{league.season}</span>
                      {gameCount > 0 && (
                        <>
                          <span className="text-bn-border">|</span>
                          <span className="text-bn-yellow text-xs font-semibold">{gameCount} 場</span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bn-ink py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 text-center">
          <p className="text-bn-steel text-xs">EMPOWER LEAGUE &copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
