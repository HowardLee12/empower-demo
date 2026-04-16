'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

interface GameRecord {
  id: string; home_squad_name: string; away_squad_name: string
  home_squad_id: string; away_squad_id: string
  home_score: number; away_score: number
  game_date: string; game_time: string | null; location: string
  quarter_scores_home: number[]; quarter_scores_away: number[]
  league_id: string | null
}

interface LeagueInfo { id: string; name: string; region: string }

interface PlayerStatRecord {
  id: string; player_id: string; team_side: string
  player_number: string; player_name: string
  points: number; fg_made: number; fg_attempted: number
  three_made: number; three_attempted: number
  ft_made: number; ft_attempted: number
  off_rebounds: number; def_rebounds: number
  assists: number; steals: number; blocks: number
  turnovers: number; fouls: number
  playing_seconds: number; plus_minus: number
}

function pct(made: number, attempted: number): string {
  if (attempted === 0) return '-'
  return `${Math.round((made / attempted) * 100)}%`
}

function fmtMin(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function StatsTable({ players, teamName, teamId }: { players: PlayerStatRecord[]; teamName: string; teamId: string }) {
  const totals = players.reduce(
    (acc, p) => ({
      points: acc.points + p.points, fg_made: acc.fg_made + p.fg_made, fg_attempted: acc.fg_attempted + p.fg_attempted,
      three_made: acc.three_made + p.three_made, three_attempted: acc.three_attempted + p.three_attempted,
      ft_made: acc.ft_made + p.ft_made, ft_attempted: acc.ft_attempted + p.ft_attempted,
      rebounds: acc.rebounds + p.off_rebounds + p.def_rebounds,
      assists: acc.assists + p.assists, steals: acc.steals + p.steals, blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers, fouls: acc.fouls + p.fouls,
    }),
    { points: 0, fg_made: 0, fg_attempted: 0, three_made: 0, three_attempted: 0, ft_made: 0, ft_attempted: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 }
  )

  return (
    <div className="rounded-[12px] bg-white border border-bn-border shadow-[rgba(32,32,37,0.05)_0px_3px_5px] overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
        <Link href={`/squads/${teamId}`} className="text-bn-ink font-bold text-sm hover:text-bn-yellow transition-colors">{teamName}</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bn-border text-bn-slate text-xs">
              <th className="py-3 px-3 text-left font-medium">#</th>
              <th className="py-3 px-3 text-left font-medium">球員</th>
              <th className="py-3 px-3 text-center font-medium">MIN</th>
              <th className="py-3 px-3 text-center font-medium text-bn-yellow">PTS</th>
              <th className="py-3 px-3 text-center font-medium">2PT</th>
              <th className="py-3 px-3 text-center font-medium">3PT</th>
              <th className="py-3 px-3 text-center font-medium">FT</th>
              <th className="py-3 px-3 text-center font-medium">REB</th>
              <th className="py-3 px-3 text-center font-medium">AST</th>
              <th className="py-3 px-3 text-center font-medium">STL</th>
              <th className="py-3 px-3 text-center font-medium">BLK</th>
              <th className="py-3 px-3 text-center font-medium">TO</th>
              <th className="py-3 px-3 text-center font-medium">PF</th>
              <th className="py-3 px-3 text-center font-medium">+/-</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const pm = p.plus_minus
              return (
                <tr key={p.id} className="border-b border-bn-border/50 hover:bg-bn-snow transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-bn-yellow text-xs">{p.player_number}</td>
                  <td className="py-3 px-3 font-semibold text-bn-ink whitespace-nowrap">{p.player_name}</td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-slate text-xs">{fmtMin(p.playing_seconds)}</td>
                  <td className="py-3 px-3 text-center font-bold text-bn-ink tabular-nums">{p.points}</td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap text-xs">{p.fg_made}/{p.fg_attempted} <span className="text-bn-slate">{pct(p.fg_made, p.fg_attempted)}</span></td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap text-xs">{p.three_made}/{p.three_attempted} <span className="text-bn-slate">{pct(p.three_made, p.three_attempted)}</span></td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap text-xs">{p.ft_made}/{p.ft_attempted} <span className="text-bn-slate">{pct(p.ft_made, p.ft_attempted)}</span></td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{p.off_rebounds + p.def_rebounds}</td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{p.assists}</td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{p.steals}</td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{p.blocks}</td>
                  <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{p.turnovers}</td>
                  <td className={`py-3 px-3 text-center tabular-nums font-bold ${p.fouls >= 4 ? 'text-bn-red' : 'text-bn-secondary'}`}>{p.fouls}</td>
                  <td className={`py-3 px-3 text-center tabular-nums font-bold ${pm > 0 ? 'text-bn-green' : pm < 0 ? 'text-bn-red' : 'text-bn-slate'}`}>{pm > 0 ? `+${pm}` : pm}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-bn-border bg-bn-snow font-bold text-bn-ink text-xs">
              <td className="py-3 px-3" colSpan={3}>合計</td>
              <td className="py-3 px-3 text-center text-bn-yellow tabular-nums">{totals.points}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.fg_made}/{totals.fg_attempted}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.three_made}/{totals.three_attempted}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.ft_made}/{totals.ft_attempted}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.rebounds}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.assists}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.steals}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.blocks}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.turnovers}</td>
              <td className="py-3 px-3 text-center tabular-nums">{totals.fouls}</td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function PublicGameDetailPage() {
  const params = useParams()
  const gameId = params.id as string
  const [game, setGame] = useState<GameRecord | null>(null)
  const [league, setLeague] = useState<LeagueInfo | null>(null)
  const [stats, setStats] = useState<PlayerStatRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [g, s] = await Promise.all([
        supabase.from('sb_games').select('*').eq('id', gameId).single(),
        supabase.from('sb_player_stats').select('*').eq('game_id', gameId).order('player_number'),
      ])
      if (g.data) {
        setGame(g.data)
        if (g.data.league_id) {
          const l = await supabase.from('sb_leagues').select('id,name,region').eq('id', g.data.league_id).single()
          if (l.data) setLeague(l.data)
        }
      }
      if (s.data) setStats(s.data)
      setLoading(false)
    }
    load()
  }, [gameId])

  if (loading) {
    return <div className="min-h-screen bg-bn-snow flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
    </div>
  }

  if (!game) {
    return <div className="min-h-screen bg-bn-snow flex items-center justify-center">
      <p className="text-bn-slate text-sm">找不到比賽紀錄</p>
    </div>
  }

  const homePlayers = stats.filter((s) => s.team_side === 'home')
  const awayPlayers = stats.filter((s) => s.team_side === 'away')
  const homeWin = game.home_score > game.away_score

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      {/* Score header */}
      <div className="bg-bn-yellow pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Link href="/" className="text-bn-ink/50 hover:text-bn-ink transition-colors">首頁</Link>
            {league && (
              <>
                <span className="text-bn-ink/30">/</span>
                <Link href={`/leagues/${league.id}`} className="text-bn-ink/50 hover:text-bn-ink transition-colors">{league.region} {league.name}</Link>
              </>
            )}
            <span className="text-bn-ink/30">/</span>
            <span className="text-bn-ink font-medium">比賽數據</span>
          </div>

          <div className="flex items-center justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <Link href={`/squads/${game.home_squad_id}`} className={`block font-bold text-base mb-2 hover:underline underline-offset-2 ${homeWin ? 'text-bn-ink' : 'text-bn-ink/50'}`}>
                {game.home_squad_name}
              </Link>
              <p className={`text-5xl sm:text-6xl font-black tabular-nums ${homeWin ? 'text-bn-ink' : 'text-bn-ink/40'}`}>{game.home_score}</p>
              {homeWin && <span className="text-bn-ink/60 text-xs font-bold mt-1 inline-block">WIN</span>}
            </div>
            <div className="text-center">
              <div className="text-bn-ink/20 text-xs font-bold tracking-widest mb-1">FINAL</div>
              <p className="text-bn-ink/30 text-sm">{game.game_date}</p>
              {game.game_time && <p className="text-bn-ink/20 text-xs">{game.game_time}</p>}
              {game.location && <p className="text-bn-ink/20 text-xs">{game.location}</p>}
            </div>
            <div className="text-center">
              <Link href={`/squads/${game.away_squad_id}`} className={`block font-bold text-base mb-2 hover:underline underline-offset-2 ${!homeWin ? 'text-bn-ink' : 'text-bn-ink/50'}`}>
                {game.away_squad_name}
              </Link>
              <p className={`text-5xl sm:text-6xl font-black tabular-nums ${!homeWin ? 'text-bn-ink' : 'text-bn-ink/40'}`}>{game.away_score}</p>
              {!homeWin && game.away_score !== game.home_score && <span className="text-bn-ink/60 text-xs font-bold mt-1 inline-block">WIN</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Quarter scores */}
      <div className="bg-white border-b border-bn-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-4">
          <table className="mx-auto text-center text-sm">
            <thead>
              <tr className="text-bn-slate text-xs">
                <th className="py-1 px-4 text-left font-medium">隊伍</th>
                {game.quarter_scores_home.map((_, i) => <th key={i} className="py-1 px-4 font-medium">Q{i + 1}</th>)}
                <th className="py-1 px-4 font-bold text-bn-ink">合計</th>
              </tr>
            </thead>
            <tbody>
              <tr className={homeWin ? 'text-bn-ink font-semibold' : 'text-bn-slate'}>
                <td className="py-1.5 px-4 text-left">{game.home_squad_name}</td>
                {game.quarter_scores_home.map((s, i) => <td key={i} className="py-1.5 px-4 tabular-nums">{s}</td>)}
                <td className="py-1.5 px-4 font-bold tabular-nums">{game.home_score}</td>
              </tr>
              <tr className={!homeWin ? 'text-bn-ink font-semibold' : 'text-bn-slate'}>
                <td className="py-1.5 px-4 text-left">{game.away_squad_name}</td>
                {game.quarter_scores_away.map((s, i) => <td key={i} className="py-1.5 px-4 tabular-nums">{s}</td>)}
                <td className="py-1.5 px-4 font-bold tabular-nums">{game.away_score}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Stats */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <StatsTable players={homePlayers} teamName={game.home_squad_name} teamId={game.home_squad_id} />
        <StatsTable players={awayPlayers} teamName={game.away_squad_name} teamId={game.away_squad_id} />
      </div>
    </div>
  )
}
