'use client'

import { useState } from 'react'
import { Team, Player, createPlayer, createTeam } from '@/lib/scoreboard-types'

interface TeamSetupProps {
  onStartGame: (homeTeam: Team, awayTeam: Team) => void
}

interface TeamFormState {
  name: string
  players: { number: string; name: string }[]
}

const EMPTY_PLAYER = { number: '', name: '' }

function createInitialTeam(label: string): TeamFormState {
  return {
    name: '',
    players: Array.from({ length: 5 }, (_, i) => ({
      number: String(i + 1),
      name: `${label}球員${i + 1}`,
    })),
  }
}

export function TeamSetup({ onStartGame }: TeamSetupProps) {
  const [home, setHome] = useState<TeamFormState>(() => createInitialTeam('主隊'))
  const [away, setAway] = useState<TeamFormState>(() => createInitialTeam('客隊'))

  const updatePlayer = (
    isHome: boolean,
    index: number,
    field: 'number' | 'name',
    value: string
  ) => {
    const setter = isHome ? setHome : setAway
    setter((prev) => ({
      ...prev,
      players: prev.players.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }))
  }

  const addPlayer = (isHome: boolean) => {
    const setter = isHome ? setHome : setAway
    setter((prev) => ({
      ...prev,
      players: [...prev.players, { ...EMPTY_PLAYER }],
    }))
  }

  const removePlayer = (isHome: boolean, index: number) => {
    const setter = isHome ? setHome : setAway
    setter((prev) => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index),
    }))
  }

  const handleStart = () => {
    const homePlayers: Player[] = home.players
      .filter((p) => p.name.trim())
      .map((p, i) => createPlayer(`home-${i}`, p.number || String(i), p.name))

    const awayPlayers: Player[] = away.players
      .filter((p) => p.name.trim())
      .map((p, i) => createPlayer(`away-${i}`, p.number || String(i), p.name))

    if (homePlayers.length === 0 || awayPlayers.length === 0) return

    const homeTeam = createTeam('home', home.name || '主隊', 'gold', homePlayers)
    const awayTeam = createTeam('away', away.name || '客隊', 'white', awayPlayers)
    onStartGame(homeTeam, awayTeam)
  }

  const renderTeamForm = (team: TeamFormState, isHome: boolean) => (
    <div className="bg-navy-light border border-white/10 rounded-xl p-4">
      <h3 className={`font-bold text-lg mb-4 ${isHome ? 'text-gold' : 'text-white'}`}>
        {isHome ? '主隊' : '客隊'}
      </h3>
      <input
        type="text"
        placeholder="隊伍名稱"
        value={team.name}
        onChange={(e) => {
          const setter = isHome ? setHome : setAway
          setter((prev) => ({ ...prev, name: e.target.value }))
        }}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 mb-4 focus:outline-none focus:border-gold/50"
      />
      <div className="space-y-2">
        {team.players.map((player, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder="#"
              value={player.number}
              onChange={(e) => updatePlayer(isHome, i, 'number', e.target.value)}
              className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center text-sm placeholder:text-white/30 focus:outline-none focus:border-gold/50"
            />
            <input
              type="text"
              placeholder="球員姓名"
              value={player.name}
              onChange={(e) => updatePlayer(isHome, i, 'name', e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-gold/50"
            />
            {team.players.length > 1 && (
              <button
                onClick={() => removePlayer(isHome, i)}
                className="px-2 text-red-400/60 hover:text-red-400 text-sm transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => addPlayer(isHome)}
        className="mt-3 text-gold/60 hover:text-gold text-xs font-medium transition-colors"
      >
        + 新增球員
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">EMPOWER 紀錄台</h1>
          <p className="text-white/40 text-sm">設定隊伍與球員名單開始比賽紀錄</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {renderTeamForm(home, true)}
          {renderTeamForm(away, false)}
        </div>
        <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-gold text-navy px-10 py-3 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors"
          >
            開始比賽
          </button>
        </div>
      </div>
    </div>
  )
}
