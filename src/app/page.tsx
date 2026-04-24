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

      {/* Header: Hero + Tabs + DateStrip combined */}
      <div className="relative pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-bn-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-bn-yellow/8 blur-[100px] rounded-full" />
        {/* Logo watermark */}
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-[0.04] pointer-events-none">
          <img src="/empower-logo.svg" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8">
          {/* Title */}
          <div className="text-center pt-5 pb-4">
            <h1 className="text-2xl font-black text-white tracking-tight">
              日程<span className="text-bn-yellow">・</span>結果
            </h1>
          </div>

          {/* Event Type Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            <button
              onClick={() => setSelectedLeagueId(null)}
              className={`px-5 py-2.5 rounded-[50px] text-sm font-semibold transition-all ${
                !selectedLeagueId
                  ? 'bg-bn-yellow text-bn-ink shadow-[0_0_16px_rgba(240,185,11,0.3)]'
                  : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white border border-white/[0.06]'
              }`}
            >
              全部
              <span className={`ml-1.5 text-xs ${!selectedLeagueId ? 'text-bn-ink/50' : 'text-white/30'}`}>
                {games.length}
              </span>
            </button>
            {eventTypes.map((type) => {
              const typeLeagues = leaguesByType.get(type) ?? []
              return typeLeagues.map((league) => {
                const count = games.filter((g) => g.league_id === league.id).length
                const isActive = selectedLeagueId === league.id
                return (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeagueId(isActive ? null : league.id)}
                    className={`px-5 py-2.5 rounded-[50px] text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-bn-yellow text-bn-ink shadow-[0_0_16px_rgba(240,185,11,0.3)]'
                        : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {league.name}
                    {count > 0 && (
                      <span className={`ml-1.5 text-xs ${isActive ? 'text-bn-ink/50' : 'text-white/30'}`}>{count}</span>
                    )}
                  </button>
                )
              })
            })}
          </div>

          {/* Date Strip inside dark header */}
          <div className="pb-4 pt-2">
            <DateStrip
              selectedDate={selectedDate}
              gameDates={gameDates}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>
      </div>

      {/* Game Cards */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5">
        {filteredGames.length === 0 ? (
          <div className="rounded-[12px] bg-white border border-bn-border p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-bn-snow mx-auto mb-4 flex items-center justify-center">
              <img src="/empower-logo.svg" alt="" className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-bn-slate text-sm font-medium">本日無賽事</p>
            <p className="text-bn-border text-xs mt-1">No games scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGames.map((g) => {
              const isCompleted = g.status === 'completed'
              const homeWin = g.home_score > g.away_score
              const awayWin = g.away_score > g.home_score
              const leagueName = leagues.find((l) => l.id === g.league_id)?.name
              const displayTime = g.game_time?.substring(0, 5)

              const card = (
                <div className={`relative rounded-[12px] bg-white border p-6 transition-all overflow-hidden ${
                  isCompleted
                    ? 'border-bn-border shadow-[rgba(32,32,37,0.04)_0px_2px_8px] hover:shadow-[rgba(240,185,11,0.08)_0px_4px_16px] hover:border-bn-yellow/30'
                    : 'border-bn-yellow/30 shadow-[rgba(240,185,11,0.05)_0px_2px_12px]'
                }`}>
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCompleted ? 'bg-bn-border' : 'bg-bn-yellow'}`} />

                  {/* Top row: time + location + status */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      {displayTime && (
                        <span className="text-bn-ink font-bold text-sm tabular-nums">{displayTime}</span>
                      )}
                      {g.location && (
                        <span className="text-bn-slate text-xs">{g.location}</span>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-bn-slate text-[10px] font-bold tracking-[0.15em]">FINAL</span>
                    )}
                  </div>

                  {/* League name centered */}
                  {leagueName && (
                    <div className="text-center mb-3">
                      <span className="text-bn-ink/30 text-sm font-bold tracking-wide">{leagueName}</span>
                    </div>
                  )}

                  {/* Score row */}
                  <div className="flex items-center">
                    <div className="flex-1 flex items-center gap-3">
                      <span className={`font-bold text-lg ${isCompleted && !homeWin ? 'text-bn-slate' : 'text-bn-ink'}`}>
                        {g.home_squad_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 px-8">
                      {isCompleted ? (
                        <>
                          <div className="text-center">
                            <span className={`text-4xl font-black tabular-nums ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_score}</span>
                            {homeWin && <div className="w-4 h-0.5 bg-bn-yellow rounded-full mx-auto mt-1" />}
                          </div>
                          <span className="text-bn-border/60 text-lg font-light">:</span>
                          <div className="text-center">
                            <span className={`text-4xl font-black tabular-nums ${awayWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_score}</span>
                            {awayWin && <div className="w-4 h-0.5 bg-bn-yellow rounded-full mx-auto mt-1" />}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-bn-ink text-lg font-black tracking-wider">VS</span>
                          <span className="text-bn-yellow text-xs font-semibold">即將開始</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex items-center gap-3 justify-end">
                      <span className={`font-bold text-lg ${isCompleted && !awayWin ? 'text-bn-slate' : 'text-bn-ink'}`}>
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
