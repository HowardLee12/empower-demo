'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

interface Squad { id: string; org_id: string; name: string; age_group: string }
interface Organization { id: string; name: string; short_name: string }
interface League { id: string; name: string; region: string; season: string }
interface RosterEntry { league_id: string; squad_id: string; player_id: string; jersey_number: string }
interface PlayerInfo { id: string; name: string; number: string }
interface PlayerStatRow {
  player_id: string; player_name: string; player_number: string
  points: number; fg_made: number; fg_attempted: number
  three_made: number; three_attempted: number
  ft_made: number; ft_attempted: number
  off_rebounds: number; def_rebounds: number
  assists: number; steals: number; blocks: number; turnovers: number; fouls: number
  playing_seconds: number; plus_minus: number; game_id: string
}
interface GameRecord { id: string; league_id: string | null }

function pct(made: number, attempted: number): string {
  if (attempted === 0) return '-'
  return `${Math.round((made / attempted) * 100)}%`
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface AggPlayer {
  name: string; number: string; games: number
  pts: number; fgm: number; fga: number; tpm: number; tpa: number
  ftm: number; fta: number; reb: number; ast: number; stl: number
  blk: number; tov: number; fouls: number; secs: number; pm: number
}

export default function SquadDetailPage() {
  const params = useParams()
  const squadId = params.id as string

  const [squad, setSquad] = useState<Squad | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const [rosters, setRosters] = useState<RosterEntry[]>([])
  const [allStats, setAllStats] = useState<PlayerStatRow[]>([])
  const [allGames, setAllGames] = useState<GameRecord[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [sqRes, lsRes, rRes, stRes, gRes, pRes] = await Promise.all([
        supabase.from('sb_squads').select('*').eq('id', squadId).single(),
        supabase.from('sb_league_squads').select('league_id').eq('squad_id', squadId),
        supabase.from('sb_league_rosters').select('*').eq('squad_id', squadId),
        supabase.from('sb_player_stats').select('*').eq('team_side', 'home'),
        supabase.from('sb_games').select('id,league_id'),
        supabase.from('sb_players').select('id,name,number').eq('squad_id', squadId),
      ])
      if (sqRes.data) {
        setSquad(sqRes.data)
        const orgRes = await supabase.from('sb_organizations').select('*').eq('id', sqRes.data.org_id).single()
        if (orgRes.data) setOrg(orgRes.data)
      }
      if (lsRes.data) {
        const leagueIds = lsRes.data.map((r: { league_id: string }) => r.league_id)
        if (leagueIds.length > 0) {
          const lRes = await supabase.from('sb_leagues').select('*').in('id', leagueIds)
          if (lRes.data) setLeagues(lRes.data)
        }
      }
      if (rRes.data) setRosters(rRes.data)
      if (gRes.data) setAllGames(gRes.data)
      if (pRes.data) setAllPlayers(pRes.data)

      // Get all stats for players in this squad (both home and away side)
      const playerIds = pRes.data?.map((p: PlayerInfo) => p.id) ?? []
      if (playerIds.length > 0) {
        const statsRes = await supabase.from('sb_player_stats').select('*').in('player_id', playerIds)
        if (statsRes.data) setAllStats(statsRes.data)
      }
      setLoading(false)
    }
    load()
  }, [squadId])

  // Build per-league aggregated stats
  const leagueStats = useMemo(() => {
    const gameLeagueMap = new Map(allGames.map((g) => [g.id, g.league_id]))
    const result = new Map<string, AggPlayer[]>()

    for (const league of leagues) {
      const rosterPlayerIds = new Set(
        rosters.filter((r) => r.league_id === league.id).map((r) => r.player_id)
      )
      // If no roster, fall back to all squad players
      const playerIds = rosterPlayerIds.size > 0 ? rosterPlayerIds : new Set(allPlayers.map((p) => p.id))

      const playerMap = new Map<string, AggPlayer>()
      for (const pid of playerIds) {
        const p = allPlayers.find((pl) => pl.id === pid)
        const rosterEntry = rosters.find((r) => r.league_id === league.id && r.player_id === pid)
        if (p) {
          playerMap.set(pid, {
            name: p.name, number: rosterEntry?.jersey_number || p.number,
            games: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0,
            ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0,
            tov: 0, fouls: 0, secs: 0, pm: 0,
          })
        }
      }

      for (const s of allStats) {
        if (!playerIds.has(s.player_id)) continue
        if (gameLeagueMap.get(s.game_id) !== league.id) continue
        const agg = playerMap.get(s.player_id)
        if (!agg) continue
        playerMap.set(s.player_id, {
          ...agg, games: agg.games + 1, pts: agg.pts + s.points,
          fgm: agg.fgm + s.fg_made, fga: agg.fga + s.fg_attempted,
          tpm: agg.tpm + s.three_made, tpa: agg.tpa + s.three_attempted,
          ftm: agg.ftm + s.ft_made, fta: agg.fta + s.ft_attempted,
          reb: agg.reb + s.off_rebounds + s.def_rebounds,
          ast: agg.ast + s.assists, stl: agg.stl + s.steals,
          blk: agg.blk + s.blocks, tov: agg.tov + s.turnovers,
          fouls: agg.fouls + s.fouls, secs: agg.secs + s.playing_seconds,
          pm: agg.pm + s.plus_minus,
        })
      }
      result.set(league.id, [...playerMap.values()].sort((a, b) => b.pts - a.pts))
    }
    return result
  }, [leagues, rosters, allStats, allGames, allPlayers])

  if (loading) {
    return <div className="min-h-screen bg-bn-snow flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
    </div>
  }

  if (!squad) {
    return <div className="min-h-screen bg-bn-snow flex items-center justify-center">
      <p className="text-bn-slate text-sm">找不到此隊伍</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      {/* Header */}
      <div className="bg-bn-yellow pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-bn-ink/50 text-sm hover:text-bn-ink transition-colors">首頁</Link>
            <span className="text-bn-ink/30 text-sm">/</span>
            <span className="text-bn-ink text-sm font-medium">{org?.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-bn-ink">{squad.name}</h1>
          <p className="text-bn-ink/60 text-sm mt-1">{squad.age_group} | {org?.name}</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-10">
        {leagues.length === 0 ? (
          <div className="rounded-[12px] bg-white border border-bn-border p-10 text-center">
            <p className="text-bn-slate text-sm">此隊伍尚未參加任何聯盟</p>
          </div>
        ) : (
          leagues.map((league) => {
            const playerStats = leagueStats.get(league.id) ?? []
            const totals = playerStats.reduce((acc, p) => ({
              games: Math.max(acc.games, p.games), pts: acc.pts + p.pts,
              fgm: acc.fgm + p.fgm, fga: acc.fga + p.fga,
              tpm: acc.tpm + p.tpm, tpa: acc.tpa + p.tpa,
              ftm: acc.ftm + p.ftm, fta: acc.fta + p.fta,
              reb: acc.reb + p.reb, ast: acc.ast + p.ast,
              stl: acc.stl + p.stl, blk: acc.blk + p.blk,
              tov: acc.tov + p.tov, fouls: acc.fouls + p.fouls,
            }), { games: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fouls: 0 })

            return (
              <section key={league.id}>
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/leagues/${league.id}`} className="text-bn-yellow hover:text-bn-active font-bold text-lg transition-colors">
                    {league.region} {league.name}
                  </Link>
                  <span className="text-bn-slate text-xs">{league.season}</span>
                </div>

                <div className="rounded-[12px] bg-white border border-bn-border shadow-[rgba(32,32,37,0.05)_0px_3px_5px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-bn-border text-bn-slate text-xs">
                          <th className="py-3 px-3 text-left font-medium">#</th>
                          <th className="py-3 px-3 text-left font-medium">球員</th>
                          <th className="py-3 px-3 text-center font-medium">場次</th>
                          <th className="py-3 px-3 text-center font-medium text-bn-yellow">得分</th>
                          <th className="py-3 px-3 text-center font-medium">二分</th>
                          <th className="py-3 px-3 text-center font-medium">三分</th>
                          <th className="py-3 px-3 text-center font-medium">罰球</th>
                          <th className="py-3 px-3 text-center font-medium">籃板</th>
                          <th className="py-3 px-3 text-center font-medium">助攻</th>
                          <th className="py-3 px-3 text-center font-medium">抄截</th>
                          <th className="py-3 px-3 text-center font-medium">阻攻</th>
                          <th className="py-3 px-3 text-center font-medium">失誤</th>
                          <th className="py-3 px-3 text-center font-medium">犯規</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerStats.map((p) => {
                          const g = p.games || 1
                          return (
                            <tr key={p.name + p.number} className="border-b border-bn-border/50 hover:bg-bn-snow transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-bn-yellow text-xs">{p.number}</td>
                              <td className="py-3 px-3 font-semibold text-bn-ink">{p.name}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-slate">{p.games}</td>
                              <td className="py-3 px-3 text-center tabular-nums font-bold text-bn-ink">{(p.pts / g).toFixed(1)}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap">
                                {(p.fgm / g).toFixed(1)}/{(p.fga / g).toFixed(1)} <span className="text-bn-slate">{pct(p.fgm, p.fga)}</span>
                              </td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap">
                                {(p.tpm / g).toFixed(1)}/{(p.tpa / g).toFixed(1)} <span className="text-bn-slate">{pct(p.tpm, p.tpa)}</span>
                              </td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary whitespace-nowrap">
                                {(p.ftm / g).toFixed(1)}/{(p.fta / g).toFixed(1)} <span className="text-bn-slate">{pct(p.ftm, p.fta)}</span>
                              </td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{(p.reb / g).toFixed(1)}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{(p.ast / g).toFixed(1)}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{(p.stl / g).toFixed(1)}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{(p.blk / g).toFixed(1)}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{(p.tov / g).toFixed(1)}</td>
                              <td className="py-3 px-3 text-center tabular-nums text-bn-secondary">{(p.fouls / g).toFixed(1)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {playerStats.some((p) => p.games > 0) && (
                        <tfoot>
                          <tr className="border-t border-bn-border bg-bn-snow font-bold text-bn-ink text-xs">
                            <td className="py-3 px-3" colSpan={2}>團隊平均</td>
                            <td className="py-3 px-3 text-center tabular-nums text-bn-slate">{totals.games}</td>
                            <td className="py-3 px-3 text-center tabular-nums text-bn-yellow">{totals.games > 0 ? (totals.pts / totals.games).toFixed(1) : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? `${(totals.fgm / totals.games).toFixed(1)}/${(totals.fga / totals.games).toFixed(1)}` : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? `${(totals.tpm / totals.games).toFixed(1)}/${(totals.tpa / totals.games).toFixed(1)}` : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? `${(totals.ftm / totals.games).toFixed(1)}/${(totals.fta / totals.games).toFixed(1)}` : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? (totals.reb / totals.games).toFixed(1) : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? (totals.ast / totals.games).toFixed(1) : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? (totals.stl / totals.games).toFixed(1) : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? (totals.blk / totals.games).toFixed(1) : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? (totals.tov / totals.games).toFixed(1) : '-'}</td>
                            <td className="py-3 px-3 text-center tabular-nums">{totals.games > 0 ? (totals.fouls / totals.games).toFixed(1) : '-'}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
