'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

interface PlayerInfo { id: string; name: string; number: string; squad_id: string }
interface SquadInfo { id: string; name: string; org_id: string; age_group: string }
interface OrgInfo { id: string; name: string; short_name: string }
interface LeagueInfo { id: string; name: string; region: string; season: string }
interface GameRecord {
  id: string; league_id: string | null; game_date: string; game_time: string | null
  home_squad_name: string; away_squad_name: string; home_score: number; away_score: number
  home_squad_id: string; away_squad_id: string; status: string
}
interface StatRecord {
  id: string; game_id: string; team_side: string; player_number: string
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

interface AggStats {
  games: number; pts: number; fgm: number; fga: number
  tpm: number; tpa: number; ftm: number; fta: number
  reb: number; ast: number; stl: number; blk: number
  tov: number; fouls: number; secs: number; pm: number
}

const EMPTY_AGG: AggStats = { games: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fouls: 0, secs: 0, pm: 0 }

function addStat(agg: AggStats, s: StatRecord): AggStats {
  return {
    games: agg.games + 1, pts: agg.pts + s.points,
    fgm: agg.fgm + s.fg_made, fga: agg.fga + s.fg_attempted,
    tpm: agg.tpm + s.three_made, tpa: agg.tpa + s.three_attempted,
    ftm: agg.ftm + s.ft_made, fta: agg.fta + s.ft_attempted,
    reb: agg.reb + s.off_rebounds + s.def_rebounds,
    ast: agg.ast + s.assists, stl: agg.stl + s.steals, blk: agg.blk + s.blocks,
    tov: agg.tov + s.turnovers, fouls: agg.fouls + s.fouls,
    secs: agg.secs + s.playing_seconds, pm: agg.pm + s.plus_minus,
  }
}

function AvgRow({ label, agg, isHeader }: { label: string; agg: AggStats; isHeader?: boolean }) {
  const g = agg.games || 1
  const cls = isHeader ? 'bg-bn-snow font-bold text-bn-ink' : 'hover:bg-bn-snow transition-colors text-bn-secondary'
  return (
    <tr className={`border-b border-bn-border/50 ${cls}`}>
      <td className="py-3 px-4 font-semibold text-bn-ink whitespace-nowrap">{label}</td>
      <td className="py-3 px-4 text-center tabular-nums">{agg.games}</td>
      <td className="py-3 px-4 text-center tabular-nums text-bn-ink font-bold">{(agg.pts / g).toFixed(1)}</td>
      <td className="py-3 px-4 text-center tabular-nums">{(agg.reb / g).toFixed(1)}</td>
      <td className="py-3 px-4 text-center tabular-nums">{(agg.ast / g).toFixed(1)}</td>
      <td className="py-3 px-4 text-center tabular-nums">{(agg.stl / g).toFixed(1)}</td>
      <td className="py-3 px-4 text-center tabular-nums">{(agg.blk / g).toFixed(1)}</td>
      <td className="py-3 px-4 text-center tabular-nums whitespace-nowrap">{pct(agg.fgm, agg.fga)}</td>
      <td className="py-3 px-4 text-center tabular-nums whitespace-nowrap">{pct(agg.tpm, agg.tpa)}</td>
      <td className="py-3 px-4 text-center tabular-nums whitespace-nowrap">{pct(agg.ftm, agg.fta)}</td>
      <td className="py-3 px-4 text-center tabular-nums">{(agg.tov / g).toFixed(1)}</td>
      <td className="py-3 px-4 text-center tabular-nums">{(agg.fouls / g).toFixed(1)}</td>
    </tr>
  )
}

export default function PlayerDetailPage() {
  const params = useParams()
  const playerId = params.id as string

  const [player, setPlayer] = useState<PlayerInfo | null>(null)
  const [squad, setSquad] = useState<SquadInfo | null>(null)
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [stats, setStats] = useState<StatRecord[]>([])
  const [games, setGames] = useState<GameRecord[]>([])
  const [leagues, setLeagues] = useState<LeagueInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: pData } = await supabase.from('sb_players').select('*').eq('id', playerId).single()
      if (!pData) { setLoading(false); return }
      setPlayer(pData)

      const [sqRes, stRes] = await Promise.all([
        supabase.from('sb_squads').select('*').eq('id', pData.squad_id).single(),
        supabase.from('sb_player_stats').select('*').eq('player_id', playerId),
      ])

      if (sqRes.data) {
        setSquad(sqRes.data)
        const { data: orgData } = await supabase.from('sb_organizations').select('*').eq('id', sqRes.data.org_id).single()
        if (orgData) setOrg(orgData)
      }

      const allStats = stRes.data ?? []
      setStats(allStats)

      if (allStats.length > 0) {
        const gameIds = [...new Set(allStats.map((s: StatRecord) => s.game_id))]
        const { data: gData } = await supabase.from('sb_games').select('*').in('id', gameIds).order('game_date', { ascending: false })
        if (gData) {
          setGames(gData)
          const leagueIds = [...new Set(gData.map((g: GameRecord) => g.league_id).filter(Boolean))] as string[]
          if (leagueIds.length > 0) {
            const { data: lData } = await supabase.from('sb_leagues').select('*').in('id', leagueIds)
            if (lData) setLeagues(lData)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [playerId])

  // Career totals
  const careerTotals = useMemo(() => stats.reduce((agg, s) => addStat(agg, s), { ...EMPTY_AGG }), [stats])

  // Per-league averages
  const leagueAverages = useMemo(() => {
    const gameLeagueMap = new Map(games.map((g) => [g.id, g.league_id]))
    const map = new Map<string, AggStats>()
    for (const s of stats) {
      const leagueId = gameLeagueMap.get(s.game_id)
      if (!leagueId) continue
      const prev = map.get(leagueId) ?? { ...EMPTY_AGG }
      map.set(leagueId, addStat(prev, s))
    }
    return map
  }, [stats, games])

  // Game log with stat for each game
  const gameLog = useMemo(() => {
    const statByGame = new Map(stats.map((s) => [s.game_id, s]))
    return games
      .filter((g) => g.status === 'completed')
      .map((g) => ({ game: g, stat: statByGame.get(g.id)! }))
      .filter((entry) => entry.stat)
  }, [stats, games])

  if (loading) {
    return <div className="min-h-screen bg-bn-snow flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
    </div>
  }

  if (!player) {
    return <div className="min-h-screen bg-bn-snow flex items-center justify-center">
      <p className="text-bn-slate text-sm">找不到此球員</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      {/* Player Header */}
      <div className="bg-bn-yellow pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Link href="/" className="text-bn-ink/50 hover:text-bn-ink transition-colors">首頁</Link>
            {squad && (
              <>
                <span className="text-bn-ink/30">/</span>
                <Link href={`/squads/${squad.id}`} className="text-bn-ink/50 hover:text-bn-ink transition-colors">{squad.name}</Link>
              </>
            )}
            <span className="text-bn-ink/30">/</span>
            <span className="text-bn-ink font-medium">{player.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[12px] bg-bn-ink/10 flex items-center justify-center">
              <span className="text-3xl font-black text-bn-ink/60">#{player.number}</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-bn-ink">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-bn-ink/60 text-sm">
                {org && <span>{org.name}</span>}
                {squad && <><span className="text-bn-ink/30">|</span><span>{squad.name}</span></>}
                {squad && <><span className="text-bn-ink/30">|</span><span>{squad.age_group}</span></>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Career Highlights */}
        {careerTotals.games > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: '場次', value: careerTotals.games.toString() },
              { label: '場均得分', value: (careerTotals.pts / careerTotals.games).toFixed(1) },
              { label: '場均籃板', value: (careerTotals.reb / careerTotals.games).toFixed(1) },
              { label: '場均助攻', value: (careerTotals.ast / careerTotals.games).toFixed(1) },
              { label: '投籃命中率', value: pct(careerTotals.fgm, careerTotals.fga) },
              { label: '三分命中率', value: pct(careerTotals.tpm, careerTotals.tpa) },
            ].map((item) => (
              <div key={item.label} className="rounded-[12px] bg-white border border-bn-border p-4 text-center shadow-[rgba(32,32,37,0.05)_0px_3px_5px]">
                <p className="text-bn-slate text-xs font-medium mb-1">{item.label}</p>
                <p className="text-2xl font-black text-bn-ink tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Per-League Averages */}
        {leagueAverages.size > 0 && (
          <section>
            <h2 className="text-xl font-bold text-bn-ink mb-1">各賽事平均數據</h2>
            <p className="text-bn-slate text-sm mb-4">Season Averages</p>
            <div className="rounded-[12px] bg-white border border-bn-border shadow-[rgba(32,32,37,0.05)_0px_3px_5px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bn-border text-bn-slate text-xs">
                      <th className="py-3 px-4 text-left font-medium">賽事</th>
                      <th className="py-3 px-4 text-center font-medium">GP</th>
                      <th className="py-3 px-4 text-center font-medium text-bn-yellow">PPG</th>
                      <th className="py-3 px-4 text-center font-medium">RPG</th>
                      <th className="py-3 px-4 text-center font-medium">APG</th>
                      <th className="py-3 px-4 text-center font-medium">SPG</th>
                      <th className="py-3 px-4 text-center font-medium">BPG</th>
                      <th className="py-3 px-4 text-center font-medium">FG%</th>
                      <th className="py-3 px-4 text-center font-medium">3P%</th>
                      <th className="py-3 px-4 text-center font-medium">FT%</th>
                      <th className="py-3 px-4 text-center font-medium">TO</th>
                      <th className="py-3 px-4 text-center font-medium">PF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...leagueAverages.entries()].map(([leagueId, agg]) => {
                      const league = leagues.find((l) => l.id === leagueId)
                      const label = league ? (
                        <Link href={`/leagues/${leagueId}`} className="text-bn-ink hover:text-bn-yellow transition-colors">
                          {league.region} {league.name}
                        </Link>
                      ) : '其他'
                      return <AvgRow key={leagueId} label={label as string} agg={agg} />
                    })}
                    {leagueAverages.size > 1 && <AvgRow label="生涯" agg={careerTotals} isHeader />}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Game Log */}
        {gameLog.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-bn-ink mb-1">比賽紀錄</h2>
            <p className="text-bn-slate text-sm mb-4">Game Log</p>
            <div className="rounded-[12px] bg-white border border-bn-border shadow-[rgba(32,32,37,0.05)_0px_3px_5px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bn-border text-bn-slate text-xs">
                      <th className="py-3 px-3 text-left font-medium">日期</th>
                      <th className="py-3 px-3 text-left font-medium">對手</th>
                      <th className="py-3 px-3 text-center font-medium">結果</th>
                      <th className="py-3 px-3 text-center font-medium">MIN</th>
                      <th className="py-3 px-3 text-center font-medium text-bn-yellow">PTS</th>
                      <th className="py-3 px-3 text-center font-medium">REB</th>
                      <th className="py-3 px-3 text-center font-medium">AST</th>
                      <th className="py-3 px-3 text-center font-medium">STL</th>
                      <th className="py-3 px-3 text-center font-medium">BLK</th>
                      <th className="py-3 px-3 text-center font-medium">2PT</th>
                      <th className="py-3 px-3 text-center font-medium">3PT</th>
                      <th className="py-3 px-3 text-center font-medium">FT</th>
                      <th className="py-3 px-3 text-center font-medium">TO</th>
                      <th className="py-3 px-3 text-center font-medium">PF</th>
                      <th className="py-3 px-3 text-center font-medium">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameLog.map(({ game: g, stat: s }) => {
                      const isHome = s.team_side === 'home'
                      const myScore = isHome ? g.home_score : g.away_score
                      const oppScore = isHome ? g.away_score : g.home_score
                      const opponent = isHome ? g.away_squad_name : g.home_squad_name
                      const won = myScore > oppScore
                      const pm = s.plus_minus

                      return (
                        <tr key={g.id} className="border-b border-bn-border/50 hover:bg-bn-snow transition-colors">
                          <td className="py-3 px-3 tabular-nums text-bn-slate text-xs">
                            <Link href={`/games/${g.id}`} className="hover:text-bn-yellow transition-colors">{g.game_date}</Link>
                          </td>
                          <td className="py-3 px-3 text-bn-ink font-medium text-xs whitespace-nowrap">
                            <span className="text-bn-slate mr-1">{isHome ? 'vs' : '@'}</span>{opponent}
                          </td>
                          <td className={`py-3 px-3 text-center font-bold text-xs ${won ? 'text-bn-green' : 'text-bn-red'}`}>
                            {won ? 'W' : 'L'} {myScore}-{oppScore}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-slate text-xs">{fmtMin(s.playing_seconds)}</td>
                          <td className="py-3 px-3 text-center tabular-nums font-bold text-bn-ink">{s.points}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{s.off_rebounds + s.def_rebounds}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{s.assists}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{s.steals}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{s.blocks}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap text-xs">
                            {s.fg_made}/{s.fg_attempted} <span className="text-bn-slate">{pct(s.fg_made, s.fg_attempted)}</span>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap text-xs">
                            {s.three_made}/{s.three_attempted} <span className="text-bn-slate">{pct(s.three_made, s.three_attempted)}</span>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap text-xs">
                            {s.ft_made}/{s.ft_attempted} <span className="text-bn-slate">{pct(s.ft_made, s.ft_attempted)}</span>
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{s.turnovers}</td>
                          <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{s.fouls}</td>
                          <td className={`py-3 px-3 text-center tabular-nums font-bold text-xs ${pm > 0 ? 'text-bn-green' : pm < 0 ? 'text-bn-red' : 'text-bn-slate'}`}>
                            {pm > 0 ? `+${pm}` : pm}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {careerTotals.games === 0 && (
          <div className="rounded-[12px] bg-white border border-bn-border p-10 text-center">
            <p className="text-bn-slate text-sm">此球員尚無比賽紀錄</p>
          </div>
        )}
      </div>
    </div>
  )
}
