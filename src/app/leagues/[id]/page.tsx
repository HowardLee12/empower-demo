'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

interface League {
  id: string
  name: string
  region: string
  season: string
}

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
}

interface StandingRow {
  squad_name: string
  wins: number
  losses: number
  points_for: number
  points_against: number
}

function buildStandings(games: GameRecord[], registeredSquads: SquadInfo[]): StandingRow[] {
  const map = new Map<string, StandingRow>()
  const ensure = (name: string) => {
    if (!map.has(name)) map.set(name, { squad_name: name, wins: 0, losses: 0, points_for: 0, points_against: 0 })
    return map.get(name)!
  }
  // Add all registered squads first
  for (const s of registeredSquads) ensure(s.name)
  for (const g of games) {
    if (g.status !== 'completed') continue
    const h = ensure(g.home_squad_name)
    const a = ensure(g.away_squad_name)
    h.points_for += g.home_score; h.points_against += g.away_score
    a.points_for += g.away_score; a.points_against += g.home_score
    if (g.home_score > g.away_score) { h.wins++; a.losses++ }
    else if (g.away_score > g.home_score) { a.wins++; h.losses++ }
  }
  for (const g of games) {
    ensure(g.home_squad_name)
    ensure(g.away_squad_name)
  }
  return [...map.values()].sort((a, b) => {
    const aTotal = a.wins + a.losses
    const bTotal = b.wins + b.losses
    const aPct = aTotal > 0 ? a.wins / aTotal : 0
    const bPct = bTotal > 0 ? b.wins / bTotal : 0
    if (bPct !== aPct) return bPct - aPct
    return (b.points_for - b.points_against) - (a.points_for - a.points_against)
  })
}

interface SquadInfo { id: string; name: string }

export default function LeagueDetailPage() {
  const params = useParams()
  const leagueId = params.id as string
  const [league, setLeague] = useState<League | null>(null)
  const [games, setGames] = useState<GameRecord[]>([])
  const [memberSquads, setMemberSquads] = useState<SquadInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [lRes, gRes, lsRes, sRes] = await Promise.all([
        supabase.from('sb_leagues').select('*').eq('id', leagueId).single(),
        supabase.from('sb_games').select('*').eq('league_id', leagueId).order('game_date', { ascending: false }),
        supabase.from('sb_league_squads').select('squad_id').eq('league_id', leagueId),
        supabase.from('sb_squads').select('id,name'),
      ])
      if (lRes.data) setLeague(lRes.data)
      if (gRes.data) setGames(gRes.data)
      if (lsRes.data && sRes.data) {
        const squadIds = new Set(lsRes.data.map((r: { squad_id: string }) => r.squad_id))
        setMemberSquads(sRes.data.filter((s: SquadInfo) => squadIds.has(s.id)))
      }
      setLoading(false)
    }
    load()
  }, [leagueId])

  const standings = useMemo(() => buildStandings(games, memberSquads), [games, memberSquads])
  const completedGames = games.filter((g) => g.status === 'completed')
  const upcomingGames = games.filter((g) => g.status !== 'completed').sort((a, b) => a.game_date.localeCompare(b.game_date))

  // Build squad name → id map from games + memberSquads
  const squadNameToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of memberSquads) map.set(s.name, s.id)
    for (const g of games) {
      if (g.home_squad_id && g.home_squad_name) map.set(g.home_squad_name, g.home_squad_id)
      if (g.away_squad_id && g.away_squad_name) map.set(g.away_squad_name, g.away_squad_id)
    }
    return map
  }, [games, memberSquads])

  if (loading) {
    return (
      <div className="min-h-screen bg-bn-snow flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
      </div>
    )
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-bn-snow flex items-center justify-center">
        <p className="text-bn-slate text-sm">找不到此聯盟</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      {/* League Header */}
      <div className="bg-bn-yellow pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-bn-ink/50 text-sm hover:text-bn-ink transition-colors">首頁</Link>
            <span className="text-bn-ink/30 text-sm">/</span>
            <span className="text-bn-ink text-sm font-medium">{league.region}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-bn-ink">{league.region} {league.name}</h1>
          <p className="text-bn-ink/60 text-sm mt-1">{league.season}</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Standings */}
        <section>
          <h2 className="text-xl font-bold text-bn-ink mb-1">Team & Standing</h2>
          <p className="text-bn-slate text-sm mb-4">戰績</p>
          <hr className="border-bn-ink w-12 mb-6" />

          {standings.length === 0 ? (
            <div className="rounded-[12px] bg-white border border-bn-border p-8 text-center">
              <p className="text-bn-slate text-sm">尚無隊伍資料</p>
            </div>
          ) : (
            <div className="rounded-[12px] bg-white border border-bn-border shadow-[rgba(32,32,37,0.05)_0px_3px_5px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bn-border text-bn-slate text-xs">
                      <th className="py-3 px-4 text-left font-medium w-12">排名</th>
                      <th className="py-3 px-4 text-left font-medium">隊伍</th>
                      <th className="py-3 px-4 text-center font-medium">勝</th>
                      <th className="py-3 px-4 text-center font-medium">敗</th>
                      <th className="py-3 px-4 text-center font-medium">勝率</th>
                      <th className="py-3 px-4 text-center font-medium">得分</th>
                      <th className="py-3 px-4 text-center font-medium">失分</th>
                      <th className="py-3 px-4 text-center font-medium">分差</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => {
                      const total = s.wins + s.losses
                      const pct = total > 0 ? (s.wins / total * 100).toFixed(0) : '-'
                      const diff = s.points_for - s.points_against
                      return (
                        <tr key={s.squad_name} className="border-b border-bn-border/50 hover:bg-bn-snow transition-colors">
                          <td className="py-4 px-4 text-bn-slate font-bold tabular-nums">{i + 1}</td>
                          <td className="py-4 px-4 font-semibold text-bn-ink">
                            {(() => {
                              const sqId = squadNameToId.get(s.squad_name)
                              return sqId ? (
                                <Link href={`/squads/${sqId}`} className="text-bn-ink hover:text-bn-yellow underline-offset-2 hover:underline transition-colors">{s.squad_name}</Link>
                              ) : s.squad_name
                            })()}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-bn-green tabular-nums">{s.wins}</td>
                          <td className="py-4 px-4 text-center tabular-nums text-bn-slate">{s.losses}</td>
                          <td className="py-4 px-4 text-center font-semibold text-bn-ink tabular-nums">{pct}{total > 0 ? '%' : ''}</td>
                          <td className="py-4 px-4 text-center tabular-nums text-bn-secondary">{s.points_for}</td>
                          <td className="py-4 px-4 text-center tabular-nums text-bn-secondary">{s.points_against}</td>
                          <td className={`py-4 px-4 text-center font-bold tabular-nums ${diff > 0 ? 'text-bn-green' : diff < 0 ? 'text-bn-red' : 'text-bn-slate'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Upcoming Schedule */}
        {upcomingGames.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-bn-ink mb-1">Schedule</h2>
            <p className="text-bn-slate text-sm mb-4">賽程</p>
            <hr className="border-bn-ink w-12 mb-6" />
            <div className="space-y-2">
              {upcomingGames.map((g) => (
                <div key={g.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-4 flex items-center justify-between shadow-[rgba(32,32,37,0.05)_0px_3px_5px]">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-bn-slate tabular-nums w-24">{g.game_date}</span>
                    <span className="text-bn-muted w-14">{g.game_time ?? '-'}</span>
                    <span className="text-bn-ink font-semibold">{g.home_squad_name}</span>
                    <span className="text-bn-border text-xs font-bold">VS</span>
                    <span className="text-bn-ink font-semibold">{g.away_squad_name}</span>
                  </div>
                  {g.location && <span className="text-bn-muted text-xs">{g.location}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        {completedGames.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-bn-ink mb-1">Results</h2>
            <p className="text-bn-slate text-sm mb-4">賽果</p>
            <hr className="border-bn-ink w-12 mb-6" />
            <div className="space-y-2">
              {completedGames.map((g) => {
                const homeWin = g.home_score > g.away_score
                const awayWin = g.away_score > g.home_score
                return (
                  <Link
                    key={g.id}
                    href={`/games/${g.id}`}
                    className="block rounded-[8px] bg-white border border-bn-border px-5 py-4 shadow-[rgba(32,32,37,0.05)_0px_3px_5px] hover:shadow-[rgba(8,8,8,0.05)_0px_3px_5px_5px] hover:border-bn-yellow/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-bn-slate tabular-nums w-24">{g.game_date}</span>
                        <span className="text-bn-muted w-14">{g.game_time ?? '-'}</span>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_squad_name}</span>
                          {homeWin && <span className="text-bn-green text-[10px] font-bold">勝</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold tabular-nums text-lg ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_score}</span>
                          <span className="text-bn-border">-</span>
                          <span className={`font-bold tabular-nums text-lg ${awayWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_score}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {awayWin && <span className="text-bn-green text-[10px] font-bold">勝</span>}
                          <span className={`font-semibold ${awayWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_squad_name}</span>
                        </div>
                      </div>
                      {g.location && <span className="text-bn-muted text-xs">{g.location}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
