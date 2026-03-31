'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface GameRecord {
  id: string
  home_squad_name: string
  away_squad_name: string
  home_score: number
  away_score: number
  game_date: string
  game_time: string | null
  location: string
  quarter_scores_home: number[]
  quarter_scores_away: number[]
}

interface PlayerStatRecord {
  id: string
  player_id: string
  team_side: string
  player_number: string
  player_name: string
  points: number
  fg_made: number
  fg_attempted: number
  three_made: number
  three_attempted: number
  ft_made: number
  ft_attempted: number
  off_rebounds: number
  def_rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  playing_seconds: number
  plus_minus: number
}

function pct(made: number, attempted: number): string {
  if (attempted === 0) return '-'
  return `${Math.round((made / attempted) * 100)}%`
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function StatsTable({ players, teamName, isHome }: { players: PlayerStatRecord[]; teamName: string; isHome: boolean }) {
  const totals = players.reduce(
    (acc, p) => ({
      points: acc.points + p.points,
      fg_made: acc.fg_made + p.fg_made,
      fg_attempted: acc.fg_attempted + p.fg_attempted,
      three_made: acc.three_made + p.three_made,
      three_attempted: acc.three_attempted + p.three_attempted,
      ft_made: acc.ft_made + p.ft_made,
      ft_attempted: acc.ft_attempted + p.ft_attempted,
      rebounds: acc.rebounds + p.off_rebounds + p.def_rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fouls: acc.fouls + p.fouls,
    }),
    { points: 0, fg_made: 0, fg_attempted: 0, three_made: 0, three_attempted: 0, ft_made: 0, ft_attempted: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 }
  )

  const thClass = 'py-2 px-3 font-semibold text-[10px] tracking-wider uppercase'

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className={`px-5 py-3 flex items-center gap-2.5 ${isHome ? 'bg-gold/[0.06]' : 'bg-white/[0.02]'}`}>
        <div className={`w-1 h-5 rounded-full ${isHome ? 'bg-gold' : 'bg-white/20'}`} />
        <h3 className={`font-bold text-sm tracking-wide ${isHome ? 'text-gold' : 'text-white/90'}`}>{teamName}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/25 border-b border-white/[0.06]">
              <th className={`${thClass} text-left`}>#</th>
              <th className={`${thClass} text-left`}>球員</th>
              <th className={`${thClass} text-white/20`}>MIN</th>
              <th className={`${thClass} text-gold/60`}>PTS</th>
              <th className={thClass}>2PT</th>
              <th className={thClass}>3PT</th>
              <th className={thClass}>FT</th>
              <th className={thClass}>REB</th>
              <th className={thClass}>AST</th>
              <th className={thClass}>STL</th>
              <th className={thClass}>BLK</th>
              <th className={thClass}>TO</th>
              <th className={thClass}>PF</th>
              <th className={thClass}>+/-</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const pm = p.plus_minus
              const pmColor = pm > 0 ? 'text-emerald-400' : pm < 0 ? 'text-red-400' : 'text-white/15'
              return (
                <tr key={p.id} className="border-b border-white/[0.04] text-white/70 hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-black text-xs">{p.player_number}</td>
                  <td className="py-2.5 px-3 font-semibold whitespace-nowrap text-xs">{p.player_name}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums text-white/30 text-[11px]">{fmtTime(p.playing_seconds)}</td>
                  <td className="py-2.5 px-3 text-center font-black text-gold tabular-nums">{p.points}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap text-[11px]">
                    {p.fg_made}/{p.fg_attempted} <span className="text-white/20">{pct(p.fg_made, p.fg_attempted)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap text-[11px]">
                    {p.three_made}/{p.three_attempted} <span className="text-white/20">{pct(p.three_made, p.three_attempted)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap text-[11px]">
                    {p.ft_made}/{p.ft_attempted} <span className="text-white/20">{pct(p.ft_made, p.ft_attempted)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{p.off_rebounds + p.def_rebounds}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{p.assists}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{p.steals}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{p.blocks}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{p.turnovers}</td>
                  <td className={`py-2.5 px-3 text-center tabular-nums font-bold ${p.fouls >= 4 ? 'text-red-400' : ''}`}>{p.fouls}</td>
                  <td className={`py-2.5 px-3 text-center tabular-nums font-bold text-xs ${pmColor}`}>
                    {pm > 0 ? `+${pm}` : pm}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="text-white/80 font-bold border-t border-white/[0.08] bg-white/[0.03]">
              <td className="py-2.5 px-3 text-[10px] tracking-widest uppercase text-white/30" colSpan={3}>Total</td>
              <td className="py-2.5 px-3 text-center text-gold tabular-nums">{totals.points}</td>
              <td className="py-2.5 px-3 text-center tabular-nums text-[11px]">{totals.fg_made}/{totals.fg_attempted}</td>
              <td className="py-2.5 px-3 text-center tabular-nums text-[11px]">{totals.three_made}/{totals.three_attempted}</td>
              <td className="py-2.5 px-3 text-center tabular-nums text-[11px]">{totals.ft_made}/{totals.ft_attempted}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{totals.rebounds}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{totals.assists}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{totals.steals}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{totals.blocks}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{totals.turnovers}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{totals.fouls}</td>
              <td className="py-2.5 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function GameDetailPage() {
  const params = useParams()
  const gameId = params.id as string
  const [game, setGame] = useState<GameRecord | null>(null)
  const [stats, setStats] = useState<PlayerStatRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [g, s] = await Promise.all([
        supabase.from('sb_games').select('*').eq('id', gameId).single(),
        supabase.from('sb_player_stats').select('*').eq('game_id', gameId).order('player_number'),
      ])
      if (g.data) setGame(g.data)
      if (s.data) setStats(s.data)
      setLoading(false)
    }
    load()
  }, [gameId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060f1d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/20 text-sm">載入中...</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#060f1d] flex items-center justify-center">
        <p className="text-white/20 text-sm">找不到比賽紀錄</p>
      </div>
    )
  }

  const homePlayers = stats.filter((s) => s.team_side === 'home')
  const awayPlayers = stats.filter((s) => s.team_side === 'away')
  const homeWin = game.home_score > game.away_score

  return (
    <div className="min-h-screen bg-[#060f1d]">
      <header className="bg-gradient-to-r from-navy-light via-[#0d2847] to-navy-light border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-black text-lg tracking-widest">
              EMPOWER
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">比賽數據</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/scoreboard/history" className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.06] transition-all">
              歷史紀錄
            </Link>
            <Link href="/scoreboard" className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.06] transition-all">
              紀錄台
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-5">
        {/* Game Summary */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gold/5 blur-3xl rounded-full pointer-events-none" />

          <div className="relative px-6 pt-8 pb-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-white/20 text-[11px] tabular-nums">
                <span>{game.game_date}</span>
                {game.game_time && (
                  <>
                    <div className="w-px h-3 bg-white/10" />
                    <span>{game.game_time}</span>
                  </>
                )}
                {game.location && (
                  <>
                    <div className="w-px h-3 bg-white/10" />
                    <span>{game.location}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 sm:gap-12">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full ${homeWin ? 'bg-gold/10 border border-gold/20' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${homeWin ? 'bg-gold' : 'bg-white/20'}`} />
                  <span className={`font-semibold text-xs tracking-widest uppercase ${homeWin ? 'text-gold' : 'text-white/40'}`}>
                    {game.home_squad_name}
                  </span>
                  {homeWin && <span className="text-gold/60 text-[10px] font-bold">W</span>}
                </div>
                <p className={`text-6xl sm:text-7xl font-black tabular-nums tracking-tight leading-none ${homeWin ? 'text-gold' : 'text-white/40'}`}>
                  {game.home_score}
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-white/15 text-[10px] font-black tracking-[0.3em]">FINAL</span>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full ${!homeWin ? 'bg-gold/10 border border-gold/20' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${!homeWin ? 'bg-gold' : 'bg-white/20'}`} />
                  <span className={`font-semibold text-xs tracking-widest uppercase ${!homeWin ? 'text-gold' : 'text-white/40'}`}>
                    {game.away_squad_name}
                  </span>
                  {!homeWin && <span className="text-gold/60 text-[10px] font-bold">W</span>}
                </div>
                <p className={`text-6xl sm:text-7xl font-black tabular-nums tracking-tight leading-none ${!homeWin ? 'text-gold' : 'text-white/40'}`}>
                  {game.away_score}
                </p>
              </div>
            </div>
          </div>

          {/* Quarter scores bar */}
          <div className="border-t border-white/[0.06] bg-white/[0.02] px-6 py-3">
            <table className="mx-auto text-center text-sm">
              <thead>
                <tr className="text-white/20 text-[10px] tracking-widest uppercase">
                  <th className="py-1 px-4 text-left font-medium">隊伍</th>
                  {game.quarter_scores_home.map((_, i) => (
                    <th key={i} className="py-1 px-4 font-medium">Q{i + 1}</th>
                  ))}
                  <th className="py-1 px-4 font-bold text-white/40">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-white/80">
                  <td className="py-1.5 px-4 text-left font-semibold text-gold text-xs">{game.home_squad_name}</td>
                  {game.quarter_scores_home.map((s, i) => (
                    <td key={i} className="py-1.5 px-4 tabular-nums text-white/50">{s}</td>
                  ))}
                  <td className="py-1.5 px-4 font-black tabular-nums">{game.home_score}</td>
                </tr>
                <tr className="text-white/60">
                  <td className="py-1.5 px-4 text-left font-semibold text-xs">{game.away_squad_name}</td>
                  {game.quarter_scores_away.map((s, i) => (
                    <td key={i} className="py-1.5 px-4 tabular-nums text-white/40">{s}</td>
                  ))}
                  <td className="py-1.5 px-4 font-black tabular-nums">{game.away_score}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Player Stats */}
        <StatsTable players={homePlayers} teamName={game.home_squad_name} isHome={true} />
        <StatsTable players={awayPlayers} teamName={game.away_squad_name} isHome={false} />
      </div>
    </div>
  )
}
