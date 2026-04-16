'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

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
}

interface PlayerStatRow {
  player_name: string
  player_number: string
  team_side: string
  points: number
  off_rebounds: number
  def_rebounds: number
  assists: number
  steals: number
  blocks: number
  game_id: string
}

interface StandingRow {
  squad_name: string
  wins: number
  losses: number
  points_for: number
  points_against: number
}

function buildStandings(games: GameRecord[]): StandingRow[] {
  const map = new Map<string, StandingRow>()
  const ensure = (name: string) => {
    if (!map.has(name)) map.set(name, { squad_name: name, wins: 0, losses: 0, points_for: 0, points_against: 0 })
    return map.get(name)!
  }
  for (const g of games) {
    if (g.status !== 'completed') continue
    const h = ensure(g.home_squad_name)
    const a = ensure(g.away_squad_name)
    h.points_for += g.home_score
    h.points_against += g.away_score
    a.points_for += g.away_score
    a.points_against += g.home_score
    if (g.home_score > g.away_score) { h.wins++; a.losses++ }
    else if (g.away_score > g.home_score) { a.wins++; h.losses++ }
  }
  return [...map.values()].sort((a, b) => {
    const aWinPct = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0
    const bWinPct = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0
    return bWinPct - aWinPct || (b.points_for - b.points_against) - (a.points_for - a.points_against)
  })
}

export default function Home() {
  const [games, setGames] = useState<GameRecord[]>([])
  const [upcoming, setUpcoming] = useState<GameRecord[]>([])
  const [recent, setRecent] = useState<GameRecord[]>([])
  const [stats, setStats] = useState<PlayerStatRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [gRes, sRes] = await Promise.all([
        supabase.from('sb_games').select('*').order('game_date', { ascending: false }),
        supabase.from('sb_player_stats').select('player_name,player_number,team_side,points,off_rebounds,def_rebounds,assists,steals,blocks,game_id'),
      ])
      const allGames: GameRecord[] = gRes.data ?? []
      setGames(allGames)
      setRecent(allGames.filter((g) => g.status === 'completed').slice(0, 6))
      setUpcoming(
        allGames
          .filter((g) => g.status === 'pending' || g.status === 'scheduled')
          .sort((a, b) => a.game_date.localeCompare(b.game_date))
          .slice(0, 6)
      )
      if (sRes.data) setStats(sRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const standings = buildStandings(games)

  // Aggregate stat leaders
  const playerAgg = new Map<string, { name: string; num: string; games: number; pts: number; reb: number; ast: number; stl: number; blk: number }>()
  for (const s of stats) {
    const key = `${s.player_name}-${s.player_number}`
    const prev = playerAgg.get(key) ?? { name: s.player_name, num: s.player_number, games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 }
    playerAgg.set(key, {
      ...prev,
      games: prev.games + 1,
      pts: prev.pts + s.points,
      reb: prev.reb + s.off_rebounds + s.def_rebounds,
      ast: prev.ast + s.assists,
      stl: prev.stl + s.steals,
      blk: prev.blk + s.blocks,
    })
  }
  const allPlayers = [...playerAgg.values()].filter((p) => p.games > 0)
  const topScorers = [...allPlayers].sort((a, b) => b.pts / b.games - a.pts / a.games).slice(0, 5)
  const topRebounders = [...allPlayers].sort((a, b) => b.reb / b.games - a.reb / a.games).slice(0, 5)
  const topAssisters = [...allPlayers].sort((a, b) => b.ast / b.games - a.ast / a.games).slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060f1d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060f1d]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d2847] to-[#060f1d]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-4">
            EMPOWER <span className="text-gold">LEAGUE</span>
          </h1>
          <p className="text-white/30 text-lg mb-8">賽程 / 戰績 / 數據</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/scoreboard"
              className="px-8 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-gold to-gold-dark text-navy hover:shadow-[0_0_24px_rgba(244,206,33,0.2)] transition-all"
            >
              開始紀錄比賽
            </Link>
            <Link
              href="/scoreboard/history"
              className="px-8 py-3 rounded-full text-sm font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white border border-white/[0.06] transition-all"
            >
              完整歷史紀錄
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
        {/* Upcoming Games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-emerald-400" />
              即將開始
            </h2>
            <span className="text-white/15 text-xs">{upcoming.length} 場</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="rounded-2xl bg-[#0d2847] border border-white/[0.06] p-8 text-center">
              <p className="text-white/15 text-sm">目前沒有排定的比賽</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.map((g) => (
                <div key={g.id} className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white/25 text-[11px] tabular-nums">{g.game_date}</span>
                    {g.game_time && <span className="text-white/15 text-[11px]">{g.game_time}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-gold font-bold text-sm">{g.home_squad_name}</p>
                    </div>
                    <div className="px-3 py-1 rounded bg-white/[0.04]">
                      <span className="text-white/15 text-[10px] font-bold tracking-widest">VS</span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-white/70 font-bold text-sm">{g.away_squad_name}</p>
                    </div>
                  </div>
                  {g.location && <p className="text-white/10 text-[11px] text-center mt-3">{g.location}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              最近賽果
            </h2>
            <Link href="/scoreboard/history" className="text-white/15 hover:text-white/30 text-xs transition-colors">
              查看全部 →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl bg-[#0d2847] border border-white/[0.06] p-8 text-center">
              <p className="text-white/15 text-sm">尚無比賽結果</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map((g) => {
                const homeWin = g.home_score > g.away_score
                return (
                  <Link
                    key={g.id}
                    href={`/scoreboard/games/${g.id}`}
                    className="group rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.06] hover:border-gold/15 p-5 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-white/20 text-[11px] tabular-nums">{g.game_date}</span>
                      <span className="text-white/8 text-[10px] font-bold tracking-widest ml-auto group-hover:text-gold/30 transition-colors">FINAL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${homeWin ? 'text-gold' : 'text-white/40'}`}>{g.home_squad_name}</p>
                      </div>
                      <div className="flex items-center gap-3 px-3">
                        <span className={`text-2xl font-black tabular-nums ${homeWin ? 'text-gold' : 'text-white/40'}`}>{g.home_score}</span>
                        <span className="text-white/10 text-xs">-</span>
                        <span className={`text-2xl font-black tabular-nums ${!homeWin ? 'text-gold' : 'text-white/40'}`}>{g.away_score}</span>
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`font-bold text-sm ${!homeWin ? 'text-gold' : 'text-white/40'}`}>{g.away_squad_name}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Standings + Stats */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
          {/* Standings */}
          <section className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 bg-white/[0.02] flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-cyan-400/50" />
              <h2 className="text-white/80 font-bold text-sm tracking-wide">戰績排名</h2>
            </div>
            {standings.length === 0 ? (
              <div className="p-8 text-center"><p className="text-white/15 text-sm">尚無戰績資料</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/25 text-[10px] tracking-wider uppercase border-b border-white/[0.06]">
                      <th className="py-2.5 px-4 text-left font-semibold">#</th>
                      <th className="py-2.5 px-4 text-left font-semibold">隊伍</th>
                      <th className="py-2.5 px-4 text-center font-semibold">勝</th>
                      <th className="py-2.5 px-4 text-center font-semibold">敗</th>
                      <th className="py-2.5 px-4 text-center font-semibold">勝率</th>
                      <th className="py-2.5 px-4 text-center font-semibold">得分</th>
                      <th className="py-2.5 px-4 text-center font-semibold">失分</th>
                      <th className="py-2.5 px-4 text-center font-semibold">分差</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => {
                      const total = s.wins + s.losses
                      const pct = total > 0 ? (s.wins / total * 100).toFixed(0) : '-'
                      const diff = s.points_for - s.points_against
                      return (
                        <tr key={s.squad_name} className="border-b border-white/[0.04] text-white/60 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-bold text-white/20">{i + 1}</td>
                          <td className="py-3 px-4 font-semibold text-white/80">{s.squad_name}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-400 tabular-nums">{s.wins}</td>
                          <td className="py-3 px-4 text-center tabular-nums">{s.losses}</td>
                          <td className="py-3 px-4 text-center tabular-nums text-gold">{pct}%</td>
                          <td className="py-3 px-4 text-center tabular-nums">{s.points_for}</td>
                          <td className="py-3 px-4 text-center tabular-nums">{s.points_against}</td>
                          <td className={`py-3 px-4 text-center tabular-nums font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-white/20'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Stat Leaders */}
          <section className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 bg-gold/[0.04] flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="text-gold/80 font-bold text-sm tracking-wide">數據領先</h2>
            </div>
            {allPlayers.length === 0 ? (
              <div className="p-8 text-center"><p className="text-white/15 text-sm">尚無數據資料</p></div>
            ) : (
              <div className="p-5 space-y-5">
                {[
                  { title: '得分王', data: topScorers, key: 'pts' as const },
                  { title: '籃板王', data: topRebounders, key: 'reb' as const },
                  { title: '助攻王', data: topAssisters, key: 'ast' as const },
                ].map(({ title, data, key }) => (
                  <div key={title}>
                    <p className="text-white/20 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">{title}</p>
                    <div className="space-y-1">
                      {data.map((p, i) => (
                        <div key={p.name + p.num} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-white/15 text-[10px] w-4 text-right tabular-nums">{i + 1}</span>
                            <span className="text-white/60 text-xs font-medium">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gold font-black text-sm tabular-nums">
                              {(p[key] / p.games).toFixed(1)}
                            </span>
                            <span className="text-white/15 text-[10px]">/ 場</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
