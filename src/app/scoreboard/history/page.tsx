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
    <div className="min-h-screen bg-[#060f1d]">
      <header className="bg-gradient-to-r from-navy-light via-[#0d2847] to-navy-light border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-black text-lg tracking-widest">
              EMPOWER
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">歷史紀錄</span>
          </div>
          <Link
            href="/scoreboard"
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.06] transition-all"
          >
            返回紀錄台
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">比賽紀錄</h1>
          <p className="text-white/25 text-sm mt-1">{games.length} 場比賽</p>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/20 text-sm">載入中...</p>
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-4 flex items-center justify-center">
              <span className="text-white/10 text-2xl">0</span>
            </div>
            <p className="text-white/20 text-sm">尚無比賽紀錄</p>
          </div>
        )}

        <div className="space-y-3">
          {games.map((g) => {
            const homeWin = g.home_score > g.away_score
            const awayWin = g.away_score > g.home_score
            return (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="group block rounded-2xl bg-gradient-to-r from-[#0d2847] to-navy-light border border-white/[0.06] hover:border-gold/20 p-5 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(244,206,33,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-white/25 text-[11px] tabular-nums">{g.game_date}</span>
                      {g.game_time && (
                        <>
                          <div className="w-px h-3 bg-white/10" />
                          <span className="text-white/15 text-[11px]">{g.game_time}</span>
                        </>
                      )}
                      {g.location && (
                        <>
                          <div className="w-px h-3 bg-white/10" />
                          <span className="text-white/15 text-[11px]">{g.location}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${homeWin ? 'text-gold' : 'text-white/40'}`}>
                          {g.home_squad_name}
                        </span>
                        <span className={`text-3xl font-black tabular-nums ${homeWin ? 'text-gold' : 'text-white/40'}`}>
                          {g.home_score}
                        </span>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-white/[0.04]">
                        <span className="text-white/15 text-[10px] font-bold tracking-widest">VS</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-3xl font-black tabular-nums ${awayWin ? 'text-gold' : 'text-white/40'}`}>
                          {g.away_score}
                        </span>
                        <span className={`font-bold text-sm ${awayWin ? 'text-gold' : 'text-white/40'}`}>
                          {g.away_squad_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-white/10 group-hover:text-gold/40 text-xs transition-colors">
                    查看 →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
