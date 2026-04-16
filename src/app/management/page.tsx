'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Organization { id: string; name: string; short_name: string }
interface Squad { id: string; org_id: string; name: string; age_group: string }
interface League { id: string; name: string; region: string; season: string; is_active: boolean }
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
  league_id: string | null
}

interface EditingGame {
  id: string | null
  home_squad_id: string
  away_squad_id: string
  game_date: string
  game_time: string
  location: string
  status: string
  league_id: string
}

interface EditingLeague {
  id: string | null
  name: string
  region: string
  season: string
}

type Tab = 'games' | 'leagues'

const ADMIN_PASSWORD = 'empower2026'

export default function ManagementPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<Tab>('games')

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [games, setGames] = useState<GameRecord[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [editingGame, setEditingGame] = useState<EditingGame | null>(null)
  const [editingLeague, setEditingLeague] = useState<EditingLeague | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const reload = useCallback(async () => {
    const [o, s, g, l] = await Promise.all([
      supabase.from('sb_organizations').select('*').order('name'),
      supabase.from('sb_squads').select('*').order('name'),
      supabase.from('sb_games').select('*').order('game_date', { ascending: false }),
      supabase.from('sb_leagues').select('*').order('region'),
    ])
    if (o.data) setOrgs(o.data)
    if (s.data) setSquads(s.data)
    if (g.data) setGames(g.data)
    if (l.data) setLeagues(l.data)
  }, [])

  useEffect(() => { if (authed) reload() }, [authed, reload])

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else setPwError(true)
  }

  // --- Game CRUD ---
  const saveGame = async () => {
    if (!editingGame || !editingGame.home_squad_id || !editingGame.away_squad_id) return
    const homeSquad = squads.find((s) => s.id === editingGame.home_squad_id)
    const awaySquad = squads.find((s) => s.id === editingGame.away_squad_id)
    const payload = {
      home_squad_id: editingGame.home_squad_id,
      away_squad_id: editingGame.away_squad_id,
      home_squad_name: homeSquad?.name ?? '',
      away_squad_name: awaySquad?.name ?? '',
      game_date: editingGame.game_date,
      game_time: editingGame.game_time || null,
      location: editingGame.location,
      status: editingGame.status,
      league_id: editingGame.league_id || null,
    }
    if (editingGame.id) await supabase.from('sb_games').update(payload).eq('id', editingGame.id)
    else await supabase.from('sb_games').insert(payload)
    setEditingGame(null); showToast('已儲存'); await reload()
  }

  const deleteGame = async (id: string) => {
    await supabase.from('sb_games').delete().eq('id', id)
    showToast('已刪除'); await reload()
  }

  const newGame = (): EditingGame => ({
    id: null, home_squad_id: '', away_squad_id: '',
    game_date: new Date().toISOString().split('T')[0], game_time: '10:00',
    location: '', status: 'pending', league_id: '',
  })

  // --- League CRUD ---
  const saveLeague = async () => {
    if (!editingLeague || !editingLeague.name.trim()) return
    if (editingLeague.id) {
      await supabase.from('sb_leagues').update({ name: editingLeague.name, region: editingLeague.region, season: editingLeague.season }).eq('id', editingLeague.id)
    } else {
      await supabase.from('sb_leagues').insert({ name: editingLeague.name, region: editingLeague.region, season: editingLeague.season })
    }
    setEditingLeague(null); showToast('已儲存'); await reload()
  }

  const deleteLeague = async (id: string) => {
    await supabase.from('sb_leagues').delete().eq('id', id)
    showToast('已刪除'); await reload()
  }

  const inputClass = 'bg-bn-snow border border-bn-border rounded-[8px] px-4 py-2.5 text-bn-ink text-sm placeholder:text-bn-slate focus:outline-none focus:border-bn-ink transition-colors'

  // --- Login ---
  if (!authed) {
    return (
      <div className="min-h-screen bg-bn-dark flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="text-bn-yellow font-bold text-2xl tracking-wider">EMPOWER</Link>
            <p className="text-bn-slate text-sm mt-2">賽事管理後台</p>
          </div>
          <div className="rounded-[12px] bg-white border border-bn-border p-6 shadow-[rgba(32,32,37,0.05)_0px_3px_5px]">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4">
              <div>
                <label className="block text-bn-secondary text-xs font-semibold mb-2">密碼</label>
                <input
                  type="password" value={pw}
                  onChange={(e) => { setPw(e.target.value); setPwError(false) }}
                  className={`${inputClass} w-full ${pwError ? 'border-bn-red' : ''}`}
                  placeholder="輸入管理密碼" autoFocus
                />
                {pwError && <p className="text-bn-red text-xs mt-2">密碼錯誤</p>}
              </div>
              <button type="submit" className="w-full py-3 rounded-[50px] font-semibold text-sm bg-bn-yellow text-bn-ink hover:bg-bn-gold active:bg-bn-active transition-colors shadow-[rgb(153,153,153)_0px_2px_10px_-3px]">
                登入
              </button>
            </form>
            <p className="text-bn-slate text-[10px] text-center mt-4">Demo 密碼：empower2026</p>
          </div>
        </div>
      </div>
    )
  }

  const pendingGames = games.filter((g) => g.status === 'pending' || g.status === 'scheduled')
  const completedGames = games.filter((g) => g.status === 'completed')

  return (
    <div className="min-h-screen bg-bn-snow">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-bn-green text-white px-5 py-2.5 rounded-[8px] shadow-lg font-semibold text-sm">{toast}</div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-bn-border px-4 py-3 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-bn-yellow font-bold text-lg tracking-wider">EMPOWER</Link>
            <span className="text-bn-border">|</span>
            <span className="text-bn-secondary text-sm font-semibold">賽事管理</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-bn-secondary hover:text-bn-ink text-sm font-medium transition-colors">回首頁</Link>
            <button onClick={() => setAuthed(false)} className="text-bn-slate hover:text-bn-ink text-sm transition-colors">登出</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: 'games' as Tab, label: '賽程管理' },
            { key: 'leagues' as Tab, label: '聯盟管理' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-bn-yellow text-bn-ink' : 'bg-white text-bn-secondary hover:bg-bn-border/40 border border-bn-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== Games Tab ===== */}
        {tab === 'games' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-bn-ink">賽程管理</h1>
              <button onClick={() => setEditingGame(newGame())} className="px-5 py-2.5 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors shadow-[rgb(153,153,153)_0px_2px_10px_-3px]">
                + 新增比賽
              </button>
            </div>

            {/* Edit Form */}
            {editingGame && (
              <div className="rounded-[12px] bg-white border border-bn-yellow/30 p-6 shadow-[rgba(32,32,37,0.05)_0px_3px_5px]">
                <h3 className="text-bn-ink font-bold text-sm mb-4">{editingGame.id ? '編輯比賽' : '新增比賽'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">日期</label>
                    <input type="date" value={editingGame.game_date} onChange={(e) => setEditingGame({ ...editingGame, game_date: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">時間</label>
                    <input type="time" value={editingGame.game_time} onChange={(e) => setEditingGame({ ...editingGame, game_time: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">地點</label>
                    <input type="text" placeholder="比賽場地" value={editingGame.location} onChange={(e) => setEditingGame({ ...editingGame, location: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">聯盟</label>
                    <select value={editingGame.league_id} onChange={(e) => setEditingGame({ ...editingGame, league_id: e.target.value })} className={`${inputClass} w-full`}>
                      <option value="">-- 不指定聯盟 --</option>
                      {leagues.map((l) => <option key={l.id} value={l.id}>{l.region} - {l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">主隊</label>
                    <select value={editingGame.home_squad_id} onChange={(e) => setEditingGame({ ...editingGame, home_squad_id: e.target.value })} className={`${inputClass} w-full`}>
                      <option value="">-- 選擇小隊 --</option>
                      {squads.map((s) => {
                        const org = orgs.find((o) => o.id === s.org_id)
                        return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option>
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">客隊</label>
                    <select value={editingGame.away_squad_id} onChange={(e) => setEditingGame({ ...editingGame, away_squad_id: e.target.value })} className={`${inputClass} w-full`}>
                      <option value="">-- 選擇小隊 --</option>
                      {squads.map((s) => {
                        const org = orgs.find((o) => o.id === s.org_id)
                        return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option>
                      })}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveGame} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                  <button onClick={() => setEditingGame(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border hover:bg-bn-border/40 transition-colors">取消</button>
                </div>
              </div>
            )}

            {/* Pending */}
            <div>
              <h2 className="text-base font-bold text-bn-ink mb-3">待開始 ({pendingGames.length})</h2>
              {pendingGames.length === 0 ? (
                <div className="rounded-[12px] bg-white border border-bn-border p-6 text-center"><p className="text-bn-slate text-sm">沒有排定的比賽</p></div>
              ) : (
                <div className="space-y-2">
                  {pendingGames.map((g) => (
                    <div key={g.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-3 flex items-center justify-between group hover:border-bn-yellow/30 transition-colors">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-bn-slate tabular-nums w-24">{g.game_date}</span>
                        <span className="text-bn-slate w-14">{g.game_time ?? '-'}</span>
                        <span className="text-bn-ink font-semibold">{g.home_squad_name}</span>
                        <span className="text-bn-border text-xs">vs</span>
                        <span className="text-bn-ink font-semibold">{g.away_squad_name}</span>
                        {g.location && <span className="text-bn-muted text-xs">{g.location}</span>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingGame({ id: g.id, home_squad_id: g.home_squad_id, away_squad_id: g.away_squad_id, game_date: g.game_date, game_time: g.game_time ?? '', location: g.location, status: g.status, league_id: g.league_id ?? '' })} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                        <button onClick={() => deleteGame(g.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed */}
            <div>
              <h2 className="text-base font-bold text-bn-ink mb-3">已結束 ({completedGames.length})</h2>
              {completedGames.length === 0 ? (
                <div className="rounded-[12px] bg-white border border-bn-border p-6 text-center"><p className="text-bn-slate text-sm">沒有已結束的比賽</p></div>
              ) : (
                <div className="space-y-2">
                  {completedGames.map((g) => {
                    const homeWin = g.home_score > g.away_score
                    return (
                      <div key={g.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-3 flex items-center justify-between group hover:border-bn-border transition-colors">
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-bn-slate tabular-nums w-24">{g.game_date}</span>
                          <span className={`font-semibold ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_squad_name}</span>
                          <span className={`font-bold tabular-nums ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_score}</span>
                          <span className="text-bn-border">-</span>
                          <span className={`font-bold tabular-nums ${!homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_score}</span>
                          <span className={`font-semibold ${!homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_squad_name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/scoreboard/games/${g.id}`} className="text-bn-slate hover:text-bn-focus text-xs font-semibold transition-colors">數據</Link>
                          <button onClick={() => deleteGame(g.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Leagues Tab ===== */}
        {tab === 'leagues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-bn-ink">聯盟管理</h1>
              <button onClick={() => setEditingLeague({ id: null, name: '', region: '', season: '' })} className="px-5 py-2.5 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors shadow-[rgb(153,153,153)_0px_2px_10px_-3px]">
                + 新增聯盟
              </button>
            </div>

            {editingLeague && (
              <div className="rounded-[12px] bg-white border border-bn-yellow/30 p-6 shadow-[rgba(32,32,37,0.05)_0px_3px_5px]">
                <h3 className="text-bn-ink font-bold text-sm mb-4">{editingLeague.id ? '編輯聯盟' : '新增聯盟'}</h3>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">名稱</label>
                    <input type="text" placeholder="2026年第一季週六男子組" value={editingLeague.name} onChange={(e) => setEditingLeague({ ...editingLeague, name: e.target.value })} className={`${inputClass} w-full`} autoFocus />
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">區域</label>
                    <input type="text" placeholder="和平信義" value={editingLeague.region} onChange={(e) => setEditingLeague({ ...editingLeague, region: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="block text-bn-secondary text-xs font-semibold mb-2">賽季</label>
                    <input type="text" placeholder="2026 Q1" value={editingLeague.season} onChange={(e) => setEditingLeague({ ...editingLeague, season: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveLeague} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                  <button onClick={() => setEditingLeague(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border hover:bg-bn-border/40 transition-colors">取消</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {leagues.map((l) => {
                const gameCount = games.filter((g) => g.league_id === l.id).length
                return (
                  <div key={l.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-4 flex items-center justify-between group hover:border-bn-yellow/30 transition-colors">
                    <div>
                      <p className="text-bn-ink font-semibold text-sm">{l.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-bn-slate text-xs">{l.region}</span>
                        <span className="text-bn-border">|</span>
                        <span className="text-bn-slate text-xs">{l.season}</span>
                        <span className="text-bn-border">|</span>
                        <span className="text-bn-yellow text-xs font-semibold">{gameCount} 場</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingLeague({ id: l.id, name: l.name, region: l.region, season: l.season })} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                      <button onClick={() => deleteLeague(l.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                    </div>
                  </div>
                )
              })}
              {leagues.length === 0 && (
                <div className="rounded-[12px] bg-white border border-bn-border p-8 text-center"><p className="text-bn-slate text-sm">尚未建立聯盟</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
