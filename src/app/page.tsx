'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { DateStrip } from '@/components/DateStrip'

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
}

export default function Home() {
  const [games, setGames] = useState<GameRecord[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
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

  const gameDates = useMemo(() => new Set(games.map((g) => g.game_date)), [games])

  // Event type tabs (from league.region)
  const eventTypes = useMemo(() => {
    const set = new Set(leagues.map((l) => l.region))
    return [...set]
  }, [leagues])

  // Filter games by date + event type
  const filteredGames = useMemo(() => {
    let result = games.filter((g) => g.game_date === selectedDate)
    if (selectedLeagueId) {
      result = result.filter((g) => g.league_id === selectedLeagueId)
    }
    return result
  }, [games, selectedDate, selectedLeagueId])

  // Group leagues by event type for the tab filter
  const leaguesByType = useMemo(() => {
    const map = new Map<string, League[]>()
    for (const l of leagues) {
      const list = map.get(l.region) ?? []
      list.push(l)
      map.set(l.region, list)
    }
    return map
  }, [leagues])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-16 pb-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-bn-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-bn-yellow/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-bn-yellow/5 blur-[100px] rounded-full" />
        {/* Logo watermark */}
        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-[0.04] pointer-events-none">
          <img src="/empower-logo.svg" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8">
          {/* Title area */}
          <div className="text-center py-8">
            <div className="inline-block mb-3">
              <div className="w-12 h-1 bg-bn-yellow rounded-full mx-auto mb-4" />
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                日程<span className="text-bn-yellow">・</span>結果
              </h1>
            </div>
            <p className="text-white/30 text-sm">EMPOWER BASKETBALL - Schedule & Results</p>
          </div>

          {/* Event Type Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            <button
              onClick={() => setSelectedLeagueId(null)}
              className={`px-4 py-2 rounded-[6px] text-sm font-semibold transition-colors ${
                !selectedLeagueId ? 'bg-bn-yellow text-bn-ink' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              全部
            </button>
            {eventTypes.map((type) => {
              const typeLeagues = leaguesByType.get(type) ?? []
              return typeLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeagueId(selectedLeagueId === league.id ? null : league.id)}
                  className={`px-4 py-2 rounded-[6px] text-sm font-semibold transition-colors ${
                    selectedLeagueId === league.id ? 'bg-bn-yellow text-bn-ink' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {league.name}
                </button>
              ))
            })}
          </div>
        </div>
      </div>

      {/* Date Strip */}
      <div className="bg-white border-b border-bn-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-3">
          <DateStrip
            selectedDate={selectedDate}
            gameDates={gameDates}
            onSelectDate={setSelectedDate}
          />
        </div>
      </div>

      {/* Game Cards */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {filteredGames.length === 0 ? (
          <div className="rounded-[12px] bg-white border border-bn-border p-12 text-center">
            <p className="text-bn-slate text-sm">本日無賽事</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGames.map((g) => {
              const isCompleted = g.status === 'completed'
              const homeWin = g.home_score > g.away_score
              const awayWin = g.away_score > g.home_score
              const leagueName = leagues.find((l) => l.id === g.league_id)?.name

              const card = (
                <div className="rounded-[12px] bg-white border border-bn-border p-6 shadow-[rgba(32,32,37,0.05)_0px_3px_5px] hover:shadow-[rgba(8,8,8,0.05)_0px_3px_5px_5px] hover:border-bn-yellow/30 transition-all">
                  {/* Top row: time + league + status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {g.game_time && (
                        <span className="text-bn-ink font-bold text-sm tabular-nums">{g.game_time}</span>
                      )}
                      {g.location && <span className="text-bn-slate text-xs">{g.location}</span>}
                    </div>
                    {leagueName && (
                      <span className="text-bn-muted text-xs">{leagueName}</span>
                    )}
                    {isCompleted && (
                      <span className="text-bn-slate text-xs font-bold tracking-wider">FINAL</span>
                    )}
                  </div>

                  {/* Score row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`font-bold text-lg ${isCompleted && homeWin ? 'text-bn-ink' : isCompleted ? 'text-bn-slate' : 'text-bn-ink'}`}>
                        {g.home_squad_name}
                      </span>
                      {isCompleted && homeWin && <span className="text-bn-green text-xs font-bold">勝</span>}
                    </div>

                    <div className="flex items-center gap-4 px-8">
                      {isCompleted ? (
                        <>
                          <span className={`text-4xl font-black tabular-nums ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_score}</span>
                          <span className="text-bn-border text-xl">-</span>
                          <span className={`text-4xl font-black tabular-nums ${awayWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_score}</span>
                        </>
                      ) : (
                        <span className="text-bn-yellow text-sm font-semibold">即將開始</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      {isCompleted && awayWin && <span className="text-bn-green text-xs font-bold">勝</span>}
                      <span className={`font-bold text-lg ${isCompleted && awayWin ? 'text-bn-ink' : isCompleted ? 'text-bn-slate' : 'text-bn-ink'}`}>
                        {g.away_squad_name}
                      </span>
                    </div>
                  </div>
                </div>
              )

              if (isCompleted) {
                return <Link key={g.id} href={`/games/${g.id}`} className="block">{card}</Link>
              }
              return <div key={g.id}>{card}</div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
