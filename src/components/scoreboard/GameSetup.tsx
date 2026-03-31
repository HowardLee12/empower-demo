'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Organization,
  Squad,
  DbPlayer,
  Team,
  createPlayer,
  createTeam,
} from '@/lib/scoreboard-types'

interface GameSetupProps {
  onStartGame: (homeTeam: Team, awayTeam: Team, gameDate: string, gameTime: string, location: string, homeSquadId: string, awaySquadId: string) => void
  onManageTeams: () => void
}

export function GameSetup({ onStartGame, onManageTeams }: GameSetupProps) {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [players, setPlayers] = useState<DbPlayer[]>([])

  const [homeOrgId, setHomeOrgId] = useState('')
  const [homeSquadId, setHomeSquadId] = useState('')
  const [awayOrgId, setAwayOrgId] = useState('')
  const [awaySquadId, setAwaySquadId] = useState('')

  const [gameDate, setGameDate] = useState(() => new Date().toISOString().split('T')[0])
  const [gameTime, setGameTime] = useState('10:00')
  const [location, setLocation] = useState('')

  const reload = useCallback(async () => {
    const [o, s, p] = await Promise.all([
      supabase.from('sb_organizations').select('*').order('name'),
      supabase.from('sb_squads').select('*').order('name'),
      supabase.from('sb_players').select('*').order('number'),
    ])
    if (o.data) setOrgs(o.data)
    if (s.data) setSquads(s.data)
    if (p.data) setPlayers(p.data)
  }, [])

  useEffect(() => { reload() }, [reload])

  const homeSquads = squads.filter((s) => s.org_id === homeOrgId)
  const awaySquads = squads.filter((s) => s.org_id === awayOrgId)
  const homePlayers = players.filter((p) => p.squad_id === homeSquadId)
  const awayPlayers = players.filter((p) => p.squad_id === awaySquadId)

  const canStart = homeSquadId && awaySquadId && homePlayers.length > 0 && awayPlayers.length > 0

  const handleStart = () => {
    if (!canStart) return

    const homeGamePlayers = homePlayers.map((p) =>
      createPlayer(p.id, p.number, p.name)
    )
    const awayGamePlayers = awayPlayers.map((p) =>
      createPlayer(p.id, p.number, p.name)
    )

    const homeSquad = squads.find((s) => s.id === homeSquadId)
    const awaySquad = squads.find((s) => s.id === awaySquadId)

    const homeTeam = createTeam('home', homeSquad?.name ?? '主隊', 'gold', homeGamePlayers)
    const awayTeam = createTeam('away', awaySquad?.name ?? '客隊', 'white', awayGamePlayers)

    onStartGame(homeTeam, awayTeam, gameDate, gameTime, location, homeSquadId, awaySquadId)
  }

  const inputClass = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40 focus:bg-white/[0.06] transition-all'

  const renderTeamPicker = (
    label: string,
    isHome: boolean,
    orgId: string,
    squadId: string,
    setOrgId: (v: string) => void,
    setSquadId: (v: string) => void,
    availableSquads: Squad[],
    squadPlayers: DbPlayer[]
  ) => (
    <div className={`rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] overflow-hidden ${isHome ? 'shadow-[0_0_24px_rgba(244,206,33,0.03)]' : ''}`}>
      {/* Team header */}
      <div className={`px-6 py-4 ${isHome ? 'bg-gold/[0.06]' : 'bg-white/[0.02]'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-6 rounded-full ${isHome ? 'bg-gold' : 'bg-white/20'}`} />
          <h3 className={`font-black text-xl tracking-wide ${isHome ? 'text-gold' : 'text-white'}`}>
            {label}
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Org selection */}
        <div>
          <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">選擇隊伍</label>
          <select
            value={orgId}
            onChange={(e) => { setOrgId(e.target.value); setSquadId('') }}
            className={inputClass}
          >
            <option value="">-- 選擇隊伍 --</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Squad selection */}
        {orgId && (
          <div>
            <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">選擇小隊</label>
            <select
              value={squadId}
              onChange={(e) => setSquadId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- 選擇小隊 --</option>
              {availableSquads.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.age_group})</option>
              ))}
            </select>
          </div>
        )}

        {/* Player roster */}
        {squadId && (
          <div>
            <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">
              球員名單 ({squadPlayers.length} 人)
            </label>
            <div className="bg-white/[0.03] rounded-xl p-4 max-h-56 overflow-y-auto border border-white/[0.04]">
              {squadPlayers.length === 0 ? (
                <p className="text-white/15 text-xs text-center py-4">此小隊尚無球員</p>
              ) : (
                <div className="space-y-1.5">
                  {squadPlayers.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 text-sm py-1">
                      <span className="font-mono text-gold font-black w-9 text-center text-xs">#{p.number}</span>
                      <span className="text-white/60">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060f1d] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            EMPOWER <span className="text-gold">紀錄台</span>
          </h1>
          <p className="text-white/30 text-sm mb-6">選擇對戰隊伍與比賽資訊開始紀錄</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onManageTeams}
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-gold/10 hover:bg-gold/20 text-gold/80 hover:text-gold border border-gold/15 transition-all"
            >
              管理隊伍與球員
            </button>
            <Link
              href="/scoreboard/history"
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.06] transition-all"
            >
              歷史紀錄
            </Link>
          </div>
        </div>

        {/* Game Info */}
        <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] p-6 mb-5">
          <h3 className="text-white/80 font-bold text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-white/20" />
            比賽資訊
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">日期</label>
              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">時間</label>
              <input
                type="time"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">地點</label>
              <input
                type="text"
                placeholder="比賽場地"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Team Selection */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {renderTeamPicker('主隊', true, homeOrgId, homeSquadId, setHomeOrgId, setHomeSquadId, homeSquads, homePlayers)}
          {renderTeamPicker('客隊', false, awayOrgId, awaySquadId, setAwayOrgId, setAwaySquadId, awaySquads, awayPlayers)}
        </div>

        {/* Start button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="px-14 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-gold to-gold-dark text-navy hover:shadow-[0_0_32px_rgba(244,206,33,0.2)] transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-[0.98]"
          >
            開始比賽
          </button>
          {!canStart && homeSquadId && awaySquadId && (
            <p className="text-red-400/50 text-xs mt-3">兩隊都需要至少一位球員</p>
          )}
        </div>
      </div>
    </div>
  )
}
