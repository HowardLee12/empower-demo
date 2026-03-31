'use client'

import { useState, useEffect, useCallback } from 'react'
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
  onStartGame: (homeTeam: Team, awayTeam: Team, gameDate: string, gameTime: string, location: string) => void
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

    onStartGame(homeTeam, awayTeam, gameDate, gameTime, location)
  }

  const selectClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold/50 appearance-none'
  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-gold/50'

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
    <div className={`bg-navy-light border border-white/10 rounded-xl p-5 ${isHome ? 'border-l-gold/40 border-l-2' : ''}`}>
      <h3 className={`font-bold text-lg mb-4 ${isHome ? 'text-gold' : 'text-white'}`}>
        {label}
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-white/40 text-xs mb-1.5">選擇隊伍</label>
          <select
            value={orgId}
            onChange={(e) => { setOrgId(e.target.value); setSquadId('') }}
            className={selectClass}
          >
            <option value="">-- 選擇隊伍 --</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {orgId && (
          <div>
            <label className="block text-white/40 text-xs mb-1.5">選擇小隊</label>
            <select
              value={squadId}
              onChange={(e) => setSquadId(e.target.value)}
              className={selectClass}
            >
              <option value="">-- 選擇小隊 --</option>
              {availableSquads.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.age_group})</option>
              ))}
            </select>
          </div>
        )}

        {squadId && (
          <div>
            <label className="block text-white/40 text-xs mb-1.5">
              球員名單 ({squadPlayers.length} 人)
            </label>
            <div className="bg-white/5 rounded-lg p-3 max-h-48 overflow-y-auto">
              {squadPlayers.length === 0 ? (
                <p className="text-white/20 text-xs text-center">此小隊尚無球員</p>
              ) : (
                <div className="space-y-1">
                  {squadPlayers.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="font-mono text-gold font-bold w-8 text-center">#{p.number}</span>
                      <span>{p.name}</span>
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
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">EMPOWER 紀錄台</h1>
          <p className="text-white/40 text-sm mb-4">選擇對戰隊伍與比賽資訊開始紀錄</p>
          <button
            onClick={onManageTeams}
            className="text-gold/70 hover:text-gold text-sm font-medium transition-colors"
          >
            管理隊伍與球員 →
          </button>
        </div>

        {/* Game Info */}
        <div className="bg-navy-light border border-white/10 rounded-xl p-5 mb-4">
          <h3 className="text-white font-bold text-sm mb-3">比賽資訊</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-white/40 text-xs mb-1.5">日期</label>
              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs mb-1.5">時間</label>
              <input
                type="time"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs mb-1.5">地點</label>
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
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {renderTeamPicker('主隊', true, homeOrgId, homeSquadId, setHomeOrgId, setHomeSquadId, homeSquads, homePlayers)}
          {renderTeamPicker('客隊', false, awayOrgId, awaySquadId, setAwayOrgId, setAwaySquadId, awaySquads, awayPlayers)}
        </div>

        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="bg-gold text-navy px-10 py-3 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            開始比賽
          </button>
          {!canStart && homeSquadId && awaySquadId && (
            <p className="text-red-400/60 text-xs mt-2">兩隊都需要至少一位球員</p>
          )}
        </div>
      </div>
    </div>
  )
}
