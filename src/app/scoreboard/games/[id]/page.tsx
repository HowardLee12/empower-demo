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

  return (
    <div className="bg-navy-light border border-white/10 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 border-b border-white/10 ${isHome ? 'bg-gold/10' : 'bg-white/5'}`}>
        <h3 className={`font-bold text-sm ${isHome ? 'text-gold' : 'text-white'}`}>{teamName}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-white/40 border-b border-white/5">
              <th className="py-2 px-2 text-left font-medium">#</th>
              <th className="py-2 px-2 text-left font-medium">球員</th>
              <th className="py-2 px-2 font-medium text-white/30">時間</th>
              <th className="py-2 px-2 font-medium text-gold">得分</th>
              <th className="py-2 px-2 font-medium">二分</th>
              <th className="py-2 px-2 font-medium">三分</th>
              <th className="py-2 px-2 font-medium">罰球</th>
              <th className="py-2 px-2 font-medium">籃板</th>
              <th className="py-2 px-2 font-medium">助攻</th>
              <th className="py-2 px-2 font-medium">抄截</th>
              <th className="py-2 px-2 font-medium">阻攻</th>
              <th className="py-2 px-2 font-medium">失誤</th>
              <th className="py-2 px-2 font-medium">犯規</th>
              <th className="py-2 px-2 font-medium">+/-</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const pm = p.plus_minus
              return (
                <tr key={p.id} className="border-b border-white/5 text-white/80">
                  <td className="py-2 px-2 font-mono font-bold">{p.player_number}</td>
                  <td className="py-2 px-2 font-medium whitespace-nowrap">{p.player_name}</td>
                  <td className="py-2 px-2 text-center tabular-nums text-white/50">{fmtTime(p.playing_seconds)}</td>
                  <td className="py-2 px-2 text-center font-bold text-gold tabular-nums">{p.points}</td>
                  <td className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
                    {p.fg_made}/{p.fg_attempted} <span className="text-white/30">{pct(p.fg_made, p.fg_attempted)}</span>
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
                    {p.three_made}/{p.three_attempted} <span className="text-white/30">{pct(p.three_made, p.three_attempted)}</span>
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
                    {p.ft_made}/{p.ft_attempted} <span className="text-white/30">{pct(p.ft_made, p.ft_attempted)}</span>
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums">{p.off_rebounds + p.def_rebounds}</td>
                  <td className="py-2 px-2 text-center tabular-nums">{p.assists}</td>
                  <td className="py-2 px-2 text-center tabular-nums">{p.steals}</td>
                  <td className="py-2 px-2 text-center tabular-nums">{p.blocks}</td>
                  <td className="py-2 px-2 text-center tabular-nums">{p.turnovers}</td>
                  <td className={`py-2 px-2 text-center tabular-nums font-bold ${p.fouls >= 4 ? 'text-red-400' : ''}`}>{p.fouls}</td>
                  <td className={`py-2 px-2 text-center tabular-nums font-bold ${pm > 0 ? 'text-green-400' : pm < 0 ? 'text-red-400' : 'text-white/30'}`}>
                    {pm > 0 ? `+${pm}` : pm}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="text-white font-bold border-t border-white/20 bg-white/5">
              <td className="py-2 px-2" colSpan={3}>合計</td>
              <td className="py-2 px-2 text-center text-gold tabular-nums">{totals.points}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.fg_made}/{totals.fg_attempted}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.three_made}/{totals.three_attempted}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.ft_made}/{totals.ft_attempted}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.rebounds}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.assists}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.steals}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.blocks}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.turnovers}</td>
              <td className="py-2 px-2 text-center tabular-nums">{totals.fouls}</td>
              <td className="py-2 px-2"></td>
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
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <p className="text-white/30">載入中...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <p className="text-white/30">找不到比賽紀錄</p>
      </div>
    )
  }

  const homePlayers = stats.filter((s) => s.team_side === 'home')
  const awayPlayers = stats.filter((s) => s.team_side === 'away')
  const homeWin = game.home_score > game.away_score

  return (
    <div className="min-h-screen bg-navy">
      <header className="bg-navy-light border-b border-white/10 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-bold text-lg tracking-wider">
              EMPOWER
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-white/50 text-sm font-medium">比賽數據</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/scoreboard/history" className="text-white/40 hover:text-white text-xs transition-colors">
              歷史紀錄
            </Link>
            <Link href="/scoreboard" className="text-white/40 hover:text-white text-xs transition-colors">
              返回紀錄台
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        {/* Game Summary */}
        <div className="bg-navy-light border border-white/10 rounded-xl p-6">
          <div className="text-center mb-4">
            <p className="text-white/30 text-xs mb-1">
              {game.game_date} {game.game_time ?? ''} {game.location ? `@ ${game.location}` : ''}
            </p>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className={`font-bold text-sm mb-1 ${homeWin ? 'text-gold' : 'text-white/60'}`}>
                {game.home_squad_name}
              </p>
              <p className={`text-5xl font-black tabular-nums ${homeWin ? 'text-gold' : 'text-white/60'}`}>
                {game.home_score}
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/20 text-lg font-bold">VS</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-sm mb-1 ${!homeWin ? 'text-gold' : 'text-white/60'}`}>
                {game.away_squad_name}
              </p>
              <p className={`text-5xl font-black tabular-nums ${!homeWin ? 'text-gold' : 'text-white/60'}`}>
                {game.away_score}
              </p>
            </div>
          </div>

          {/* Quarter scores */}
          <div className="mt-4 overflow-x-auto">
            <table className="mx-auto text-center text-sm">
              <thead>
                <tr className="text-white/40 text-xs">
                  <th className="py-1 px-3 text-left font-medium">隊伍</th>
                  {game.quarter_scores_home.map((_, i) => (
                    <th key={i} className="py-1 px-3 font-medium">Q{i + 1}</th>
                  ))}
                  <th className="py-1 px-3 font-bold text-white/60">合計</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-white">
                  <td className="py-1 px-3 text-left text-gold font-medium">{game.home_squad_name}</td>
                  {game.quarter_scores_home.map((s, i) => (
                    <td key={i} className="py-1 px-3 tabular-nums">{s}</td>
                  ))}
                  <td className="py-1 px-3 font-bold tabular-nums">{game.home_score}</td>
                </tr>
                <tr className="text-white/80">
                  <td className="py-1 px-3 text-left font-medium">{game.away_squad_name}</td>
                  {game.quarter_scores_away.map((s, i) => (
                    <td key={i} className="py-1 px-3 tabular-nums">{s}</td>
                  ))}
                  <td className="py-1 px-3 font-bold tabular-nums">{game.away_score}</td>
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
