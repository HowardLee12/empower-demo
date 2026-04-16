'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Organization { id: string; name: string; short_name: string }
interface Squad { id: string; org_id: string; name: string; age_group: string }
interface GameRecord {
  id: string
  home_squad_id: string
  away_squad_id: string
  home_squad_name: string
  away_squad_name: string
  home_score: number
  away_score: number
  game_date: string
  game_time: string | null
  location: string
  status: string
}

interface EditingGame {
  id: string | null
  home_squad_id: string
  away_squad_id: string
  game_date: string
  game_time: string
  location: string
  status: string
}

const ADMIN_PASSWORD = 'empower2026'

export default function ManagementPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [games, setGames] = useState<GameRecord[]>([])
  const [editing, setEditing] = useState<EditingGame | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const reload = useCallback(async () => {
    const [o, s, g] = await Promise.all([
      supabase.from('sb_organizations').select('*').order('name'),
      supabase.from('sb_squads').select('*').order('name'),
      supabase.from('sb_games').select('*').order('game_date', { ascending: false }),
    ])
    if (o.data) setOrgs(o.data)
    if (s.data) setSquads(s.data)
    if (g.data) setGames(g.data)
  }, [])

  useEffect(() => { if (authed) reload() }, [authed, reload])

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  const getSquadDisplayName = (squadId: string) => {
    const squad = squads.find((s) => s.id === squadId)
    return squad?.name ?? '未選擇'
  }

  const saveGame = async () => {
    if (!editing || !editing.home_squad_id || !editing.away_squad_id) return

    const homeSquad = squads.find((s) => s.id === editing.home_squad_id)
    const awaySquad = squads.find((s) => s.id === editing.away_squad_id)

    const payload = {
      home_squad_id: editing.home_squad_id,
      away_squad_id: editing.away_squad_id,
      home_squad_name: homeSquad?.name ?? '',
      away_squad_name: awaySquad?.name ?? '',
      game_date: editing.game_date,
      game_time: editing.game_time || null,
      location: editing.location,
      status: editing.status,
    }

    if (editing.id) {
      await supabase.from('sb_games').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('sb_games').insert(payload)
    }
    setEditing(null)
    showToast('已儲存')
    await reload()
  }

  const deleteGame = async (id: string) => {
    await supabase.from('sb_games').delete().eq('id', id)
    showToast('已刪除')
    await reload()
  }

  const newGame = (): EditingGame => ({
    id: null,
    home_squad_id: '',
    away_squad_id: '',
    game_date: new Date().toISOString().split('T')[0],
    game_time: '10:00',
    location: '',
    status: 'pending',
  })

  const inputClass = 'bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-all'

  // --- Login ---
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#060f1d] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="text-gold font-black text-2xl tracking-widest">EMPOWER</Link>
            <p className="text-white/25 text-sm mt-2">賽事管理後台</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4">
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">密碼</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setPwError(false) }}
                  className={`${inputClass} w-full ${pwError ? 'border-red-500/50' : ''}`}
                  placeholder="輸入管理密碼"
                  autoFocus
                />
                {pwError && <p className="text-red-400/60 text-xs mt-2">密碼錯誤</p>}
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-gold to-gold-dark text-navy hover:shadow-[0_0_24px_rgba(244,206,33,0.15)] transition-all"
              >
                登入
              </button>
            </form>
            <p className="text-white/15 text-[10px] text-center mt-4">Demo 密碼：empower2026</p>
          </div>
        </div>
      </div>
    )
  }

  // --- Dashboard ---
  const pendingGames = games.filter((g) => g.status === 'pending' || g.status === 'scheduled')
  const completedGames = games.filter((g) => g.status === 'completed')

  return (
    <div className="min-h-screen bg-[#060f1d]">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 font-semibold text-sm">
          {toast}
        </div>
      )}

      <header className="bg-gradient-to-r from-navy-light via-[#0d2847] to-navy-light border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gold font-black text-lg tracking-widest">EMPOWER</Link>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">賽事管理</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.06] transition-all">
              回首頁
            </Link>
            <button
              onClick={() => setAuthed(false)}
              className="text-white/20 hover:text-white/50 text-xs transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* New Game Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-tight">賽程管理</h1>
          <button
            onClick={() => setEditing(newGame())}
            className="px-5 py-2.5 rounded-full text-sm font-bold bg-gold/10 hover:bg-gold/20 text-gold/80 hover:text-gold border border-gold/15 transition-all"
          >
            + 新增比賽
          </button>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-gold/20 p-6 shadow-[0_0_24px_rgba(244,206,33,0.05)]">
            <h3 className="text-gold font-bold text-sm mb-4">{editing.id ? '編輯比賽' : '新增比賽'}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">日期</label>
                <input type="date" value={editing.game_date} onChange={(e) => setEditing({ ...editing, game_date: e.target.value })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">時間</label>
                <input type="time" value={editing.game_time} onChange={(e) => setEditing({ ...editing, game_time: e.target.value })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">地點</label>
                <input type="text" placeholder="比賽場地" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">主隊</label>
                <select value={editing.home_squad_id} onChange={(e) => setEditing({ ...editing, home_squad_id: e.target.value })} className={`${inputClass} w-full`}>
                  <option value="">-- 選擇小隊 --</option>
                  {squads.map((s) => {
                    const org = orgs.find((o) => o.id === s.org_id)
                    return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">客隊</label>
                <select value={editing.away_squad_id} onChange={(e) => setEditing({ ...editing, away_squad_id: e.target.value })} className={`${inputClass} w-full`}>
                  <option value="">-- 選擇小隊 --</option>
                  {squads.map((s) => {
                    const org = orgs.find((o) => o.id === s.org_id)
                    return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-white/30 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">狀態</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={`${inputClass} w-full`}>
                  <option value="pending">待開始</option>
                  <option value="scheduled">已排定</option>
                  <option value="completed">已結束</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveGame} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gold text-navy hover:bg-gold-dark transition-colors">
                儲存
              </button>
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white/40 transition-colors">
                取消
              </button>
            </div>
          </div>
        )}

        {/* Pending Games */}
        <section>
          <h2 className="text-lg font-bold text-white/80 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-emerald-400" />
            待開始 ({pendingGames.length})
          </h2>
          {pendingGames.length === 0 ? (
            <div className="rounded-xl bg-[#0d2847] border border-white/[0.06] p-6 text-center">
              <p className="text-white/15 text-sm">沒有排定的比賽</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingGames.map((g) => (
                <div key={g.id} className="rounded-xl bg-[#0d2847] border border-white/[0.06] px-5 py-4 flex items-center justify-between group hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-6">
                    <div className="text-white/20 text-xs tabular-nums w-24">{g.game_date}</div>
                    <div className="text-white/15 text-xs w-16">{g.game_time ?? '-'}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-gold font-semibold text-sm">{g.home_squad_name}</span>
                      <span className="text-white/15 text-[10px]">vs</span>
                      <span className="text-white/70 font-semibold text-sm">{g.away_squad_name}</span>
                    </div>
                    {g.location && <span className="text-white/10 text-xs">{g.location}</span>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing({
                        id: g.id,
                        home_squad_id: g.home_squad_id,
                        away_squad_id: g.away_squad_id,
                        game_date: g.game_date,
                        game_time: g.game_time ?? '',
                        location: g.location,
                        status: g.status,
                      })}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/20 hover:text-gold hover:bg-gold/10 transition-all"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => deleteGame(g.id)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Games */}
        <section>
          <h2 className="text-lg font-bold text-white/80 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-white/20" />
            已結束 ({completedGames.length})
          </h2>
          {completedGames.length === 0 ? (
            <div className="rounded-xl bg-[#0d2847] border border-white/[0.06] p-6 text-center">
              <p className="text-white/15 text-sm">沒有已結束的比賽</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedGames.map((g) => {
                const homeWin = g.home_score > g.away_score
                return (
                  <div key={g.id} className="rounded-xl bg-[#0d2847] border border-white/[0.06] px-5 py-4 flex items-center justify-between group hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-6">
                      <div className="text-white/20 text-xs tabular-nums w-24">{g.game_date}</div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold text-sm ${homeWin ? 'text-gold' : 'text-white/40'}`}>{g.home_squad_name}</span>
                        <span className={`font-black tabular-nums ${homeWin ? 'text-gold' : 'text-white/40'}`}>{g.home_score}</span>
                        <span className="text-white/10 text-xs">-</span>
                        <span className={`font-black tabular-nums ${!homeWin ? 'text-gold' : 'text-white/40'}`}>{g.away_score}</span>
                        <span className={`font-semibold text-sm ${!homeWin ? 'text-gold' : 'text-white/40'}`}>{g.away_squad_name}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/scoreboard/games/${g.id}`}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                      >
                        數據
                      </Link>
                      <button
                        onClick={() => deleteGame(g.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
