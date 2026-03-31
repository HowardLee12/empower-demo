'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  status: string
  quarter_scores_home: number[]
  quarter_scores_away: number[]
  created_at: string
}

export default function HistoryPage() {
  const [games, setGames] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sb_games')
        .select('*')
        .eq('status', 'completed')
        .order('game_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (data) setGames(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-navy">
      <header className="bg-navy-light border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-bold text-lg tracking-wider">
              EMPOWER
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-white/50 text-sm font-medium">歷史紀錄</span>
          </div>
          <Link
            href="/scoreboard"
            className="text-white/40 hover:text-white text-xs transition-colors"
          >
            返回紀錄台
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-black text-white mb-6">比賽紀錄</h1>

        {loading && (
          <p className="text-white/30 text-center py-12">載入中...</p>
        )}

        {!loading && games.length === 0 && (
          <p className="text-white/30 text-center py-12">尚無比賽紀錄</p>
        )}

        <div className="space-y-3">
          {games.map((g) => {
            const homeWin = g.home_score > g.away_score
            const awayWin = g.away_score > g.home_score
            return (
              <Link
                key={g.id}
                href={`/scoreboard/games/${g.id}`}
                className="block bg-navy-light border border-white/10 rounded-xl p-4 hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white/30 text-xs">{g.game_date}</span>
                      {g.game_time && <span className="text-white/20 text-xs">{g.game_time}</span>}
                      {g.location && <span className="text-white/20 text-xs">@ {g.location}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${homeWin ? 'text-gold' : 'text-white/60'}`}>
                          {g.home_squad_name}
                        </span>
                        <span className={`text-2xl font-black tabular-nums ${homeWin ? 'text-gold' : 'text-white/60'}`}>
                          {g.home_score}
                        </span>
                      </div>
                      <span className="text-white/20 text-xs">vs</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-black tabular-nums ${awayWin ? 'text-gold' : 'text-white/60'}`}>
                          {g.away_score}
                        </span>
                        <span className={`font-bold text-sm ${awayWin ? 'text-gold' : 'text-white/60'}`}>
                          {g.away_squad_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-white/20 text-xs">查看詳情 →</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
