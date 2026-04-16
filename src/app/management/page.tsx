'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Organization { id: string; name: string; short_name: string }
interface Squad { id: string; org_id: string; name: string; age_group: string }
interface DbPlayer { id: string; squad_id: string; number: string; name: string }
interface League { id: string; name: string; region: string; season: string; is_active: boolean }
interface GameRecord {
  id: string; home_squad_id: string; away_squad_id: string
  home_squad_name: string; away_squad_name: string
  home_score: number; away_score: number
  game_date: string; game_time: string | null
  location: string; status: string; league_id: string | null
}

interface EditingGame { id: string | null; home_squad_id: string; away_squad_id: string; game_date: string; game_time: string; location: string; status: string; league_id: string }
interface EditingLeague { id: string | null; name: string; region: string; season: string }
interface EditingOrg { id: string | null; name: string; short_name: string }
interface EditingSquad { id: string | null; org_id: string; name: string; age_group: string }
interface EditingPlayer { id: string | null; squad_id: string; number: string; name: string }

type Tab = 'games' | 'leagues' | 'teams'
const ADMIN_PASSWORD = 'empower2026'

export default function ManagementPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<Tab>('games')

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [players, setPlayers] = useState<DbPlayer[]>([])
  const [games, setGames] = useState<GameRecord[]>([])
  const [leagues, setLeagues] = useState<League[]>([])

  const [leagueSquadIds, setLeagueSquadIds] = useState<{ league_id: string; squad_id: string }[]>([])
  const [leagueRosters, setLeagueRosters] = useState<{ league_id: string; squad_id: string; player_id: string; jersey_number: string }[]>([])

  const [editingGame, setEditingGame] = useState<EditingGame | null>(null)
  const [editingLeague, setEditingLeague] = useState<EditingLeague | null>(null)
  const [editingOrg, setEditingOrg] = useState<EditingOrg | null>(null)
  const [editingSquad, setEditingSquad] = useState<EditingSquad | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayer | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [selectedLeagueSquadId, setSelectedLeagueSquadId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const reload = useCallback(async () => {
    const [o, s, g, l, p, ls] = await Promise.all([
      supabase.from('sb_organizations').select('*').order('name'),
      supabase.from('sb_squads').select('*').order('name'),
      supabase.from('sb_games').select('*').order('game_date', { ascending: false }),
      supabase.from('sb_leagues').select('*').order('region'),
      supabase.from('sb_players').select('*').order('number'),
      supabase.from('sb_league_squads').select('league_id,squad_id'),
    ])
    if (o.data) setOrgs(o.data)
    if (s.data) setSquads(s.data)
    if (g.data) setGames(g.data)
    if (l.data) setLeagues(l.data)
    if (p.data) setPlayers(p.data)
    if (ls.data) setLeagueSquadIds(ls.data)
    const lr = await supabase.from('sb_league_rosters').select('league_id,squad_id,player_id,jersey_number')
    if (lr.data) setLeagueRosters(lr.data)
  }, [])

  useEffect(() => { if (authed) reload() }, [authed, reload])

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) } else setPwError(true)
  }

  // --- Game CRUD ---
  const saveGame = async () => {
    if (!editingGame?.home_squad_id || !editingGame?.away_squad_id) return
    const homeSquad = squads.find((s) => s.id === editingGame.home_squad_id)
    const awaySquad = squads.find((s) => s.id === editingGame.away_squad_id)
    const payload = {
      home_squad_id: editingGame.home_squad_id, away_squad_id: editingGame.away_squad_id,
      home_squad_name: homeSquad?.name ?? '', away_squad_name: awaySquad?.name ?? '',
      game_date: editingGame.game_date, game_time: editingGame.game_time || null,
      location: editingGame.location, status: editingGame.status, league_id: editingGame.league_id || null,
    }
    if (editingGame.id) await supabase.from('sb_games').update(payload).eq('id', editingGame.id)
    else await supabase.from('sb_games').insert(payload)
    setEditingGame(null); showToast('已儲存'); await reload()
  }
  const deleteGame = async (id: string) => { await supabase.from('sb_games').delete().eq('id', id); showToast('已刪除'); await reload() }
  const newGame = (): EditingGame => ({ id: null, home_squad_id: '', away_squad_id: '', game_date: new Date().toISOString().split('T')[0], game_time: '10:00', location: '', status: 'pending', league_id: '' })

  // --- League CRUD ---
  const saveLeague = async () => {
    if (!editingLeague?.name.trim()) return
    if (editingLeague.id) await supabase.from('sb_leagues').update({ name: editingLeague.name, region: editingLeague.region, season: editingLeague.season }).eq('id', editingLeague.id)
    else await supabase.from('sb_leagues').insert({ name: editingLeague.name, region: editingLeague.region, season: editingLeague.season })
    setEditingLeague(null); showToast('已儲存'); await reload()
  }
  const deleteLeague = async (id: string) => {
    await supabase.from('sb_leagues').delete().eq('id', id)
    if (selectedLeagueId === id) setSelectedLeagueId(null)
    showToast('已刪除'); await reload()
  }

  // --- League Squad management ---
  const addSquadToLeague = async (leagueId: string, squadId: string) => {
    await supabase.from('sb_league_squads').insert({ league_id: leagueId, squad_id: squadId })
    showToast('已加入'); await reload()
  }
  const removeSquadFromLeague = async (leagueId: string, squadId: string) => {
    await supabase.from('sb_league_squads').delete().eq('league_id', leagueId).eq('squad_id', squadId)
    showToast('已移除'); await reload()
  }

  // --- League Roster management ---
  const addPlayerToRoster = async (leagueId: string, squadId: string, playerId: string, jerseyNumber: string) => {
    await supabase.from('sb_league_rosters').insert({ league_id: leagueId, squad_id: squadId, player_id: playerId, jersey_number: jerseyNumber })
    showToast('已加入名單'); await reload()
  }
  const removePlayerFromRoster = async (leagueId: string, squadId: string, playerId: string) => {
    await supabase.from('sb_league_rosters').delete().eq('league_id', leagueId).eq('squad_id', squadId).eq('player_id', playerId)
    showToast('已移除'); await reload()
  }

  // --- Org CRUD ---
  const saveOrg = async () => {
    if (!editingOrg?.name.trim()) return
    if (editingOrg.id) await supabase.from('sb_organizations').update({ name: editingOrg.name, short_name: editingOrg.short_name }).eq('id', editingOrg.id)
    else await supabase.from('sb_organizations').insert({ name: editingOrg.name, short_name: editingOrg.short_name })
    setEditingOrg(null); showToast('已儲存'); await reload()
  }
  const deleteOrg = async (id: string) => {
    await supabase.from('sb_organizations').delete().eq('id', id)
    if (selectedOrgId === id) { setSelectedOrgId(null); setSelectedSquadId(null) }
    showToast('已刪除'); await reload()
  }

  // --- Squad CRUD ---
  const saveSquad = async () => {
    if (!editingSquad?.name.trim() || !editingSquad?.org_id) return
    if (editingSquad.id) await supabase.from('sb_squads').update({ name: editingSquad.name, age_group: editingSquad.age_group }).eq('id', editingSquad.id)
    else await supabase.from('sb_squads').insert({ org_id: editingSquad.org_id, name: editingSquad.name, age_group: editingSquad.age_group })
    setEditingSquad(null); showToast('已儲存'); await reload()
  }
  const deleteSquad = async (id: string) => {
    await supabase.from('sb_squads').delete().eq('id', id)
    if (selectedSquadId === id) setSelectedSquadId(null)
    showToast('已刪除'); await reload()
  }

  // --- Player CRUD ---
  const savePlayer = async () => {
    if (!editingPlayer?.name.trim() || !editingPlayer?.squad_id) return
    if (editingPlayer.id) await supabase.from('sb_players').update({ number: editingPlayer.number, name: editingPlayer.name }).eq('id', editingPlayer.id)
    else await supabase.from('sb_players').insert({ squad_id: editingPlayer.squad_id, number: editingPlayer.number, name: editingPlayer.name })
    setEditingPlayer(null); showToast('已儲存'); await reload()
  }
  const deletePlayer = async (id: string) => { await supabase.from('sb_players').delete().eq('id', id); showToast('已刪除'); await reload() }

  const inputClass = 'bg-bn-snow border border-bn-border rounded-[8px] px-4 py-2.5 text-bn-ink text-sm placeholder:text-bn-slate focus:outline-none focus:border-bn-ink transition-colors'

  const orgSquads = squads.filter((s) => s.org_id === selectedOrgId)
  const squadPlayers = players.filter((p) => p.squad_id === selectedSquadId)

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
                <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setPwError(false) }}
                  className={`${inputClass} w-full ${pwError ? 'border-bn-red' : ''}`} placeholder="輸入管理密碼" autoFocus />
                {pwError && <p className="text-bn-red text-xs mt-2">密碼錯誤</p>}
              </div>
              <button type="submit" className="w-full py-3 rounded-[50px] font-semibold text-sm bg-bn-yellow text-bn-ink hover:bg-bn-gold active:bg-bn-active transition-colors">登入</button>
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
      {toast && <div className="fixed top-4 right-4 z-50 bg-bn-green text-white px-5 py-2.5 rounded-[8px] shadow-lg font-semibold text-sm">{toast}</div>}

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
          {([
            { key: 'games' as Tab, label: '賽程管理' },
            { key: 'leagues' as Tab, label: '聯盟管理' },
            { key: 'teams' as Tab, label: '隊伍管理' },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${tab === t.key ? 'bg-bn-yellow text-bn-ink' : 'bg-white text-bn-secondary hover:bg-bn-border/40 border border-bn-border'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== Games Tab ===== */}
        {tab === 'games' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-bn-ink">賽程管理</h1>
              <button onClick={() => setEditingGame(newGame())} className="px-5 py-2.5 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">+ 新增比賽</button>
            </div>

            {editingGame && (
              <div className="rounded-[12px] bg-white border border-bn-yellow/30 p-6">
                <h3 className="text-bn-ink font-bold text-sm mb-4">{editingGame.id ? '編輯比賽' : '新增比賽'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">日期</label><input type="date" value={editingGame.game_date} onChange={(e) => setEditingGame({ ...editingGame, game_date: e.target.value })} className={`${inputClass} w-full`} /></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">時間</label><input type="time" value={editingGame.game_time} onChange={(e) => setEditingGame({ ...editingGame, game_time: e.target.value })} className={`${inputClass} w-full`} /></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">地點</label><input type="text" placeholder="比賽場地" value={editingGame.location} onChange={(e) => setEditingGame({ ...editingGame, location: e.target.value })} className={`${inputClass} w-full`} /></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">聯盟</label><select value={editingGame.league_id} onChange={(e) => setEditingGame({ ...editingGame, league_id: e.target.value })} className={`${inputClass} w-full`}><option value="">-- 不指定 --</option>{leagues.map((l) => <option key={l.id} value={l.id}>{l.region} - {l.name}</option>)}</select></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">主隊</label><select value={editingGame.home_squad_id} onChange={(e) => setEditingGame({ ...editingGame, home_squad_id: e.target.value })} className={`${inputClass} w-full`}><option value="">-- 選擇 --</option>{squads.map((s) => { const org = orgs.find((o) => o.id === s.org_id); return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option> })}</select></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">客隊</label><select value={editingGame.away_squad_id} onChange={(e) => setEditingGame({ ...editingGame, away_squad_id: e.target.value })} className={`${inputClass} w-full`}><option value="">-- 選擇 --</option>{squads.map((s) => { const org = orgs.find((o) => o.id === s.org_id); return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option> })}</select></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveGame} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                  <button onClick={() => setEditingGame(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors">取消</button>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-base font-bold text-bn-ink mb-3">待開始 ({pendingGames.length})</h2>
              {pendingGames.length === 0 ? <div className="rounded-[12px] bg-white border border-bn-border p-6 text-center"><p className="text-bn-slate text-sm">沒有排定的比賽</p></div> : (
                <div className="space-y-2">{pendingGames.map((g) => (
                  <div key={g.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-3 flex items-center justify-between group hover:border-bn-yellow/30 transition-colors">
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-bn-slate tabular-nums w-24">{g.game_date}</span>
                      <span className="text-bn-slate w-14">{g.game_time ?? '-'}</span>
                      <span className="text-bn-ink font-semibold">{g.home_squad_name}</span>
                      <span className="text-bn-border text-xs">vs</span>
                      <span className="text-bn-ink font-semibold">{g.away_squad_name}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingGame({ id: g.id, home_squad_id: g.home_squad_id, away_squad_id: g.away_squad_id, game_date: g.game_date, game_time: g.game_time ?? '', location: g.location, status: g.status, league_id: g.league_id ?? '' })} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                      <button onClick={() => deleteGame(g.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-bn-ink mb-3">已結束 ({completedGames.length})</h2>
              {completedGames.length === 0 ? <div className="rounded-[12px] bg-white border border-bn-border p-6 text-center"><p className="text-bn-slate text-sm">沒有已結束的比賽</p></div> : (
                <div className="space-y-2">{completedGames.map((g) => {
                  const homeWin = g.home_score > g.away_score
                  return (
                    <div key={g.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-3 flex items-center justify-between group transition-colors">
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
                })}</div>
              )}
            </div>
          </div>
        )}

        {/* ===== Leagues Tab ===== */}
        {tab === 'leagues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-bn-ink">聯盟管理</h1>
              <button onClick={() => setEditingLeague({ id: null, name: '', region: '', season: '' })} className="px-5 py-2.5 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">+ 新增聯盟</button>
            </div>
            {editingLeague && (
              <div className="rounded-[12px] bg-white border border-bn-yellow/30 p-6">
                <h3 className="text-bn-ink font-bold text-sm mb-4">{editingLeague.id ? '編輯聯盟' : '新增聯盟'}</h3>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">名稱</label><input type="text" placeholder="2026年第一季週六男子組" value={editingLeague.name} onChange={(e) => setEditingLeague({ ...editingLeague, name: e.target.value })} className={`${inputClass} w-full`} autoFocus /></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">區域</label><input type="text" placeholder="北區" value={editingLeague.region} onChange={(e) => setEditingLeague({ ...editingLeague, region: e.target.value })} className={`${inputClass} w-full`} /></div>
                  <div><label className="block text-bn-secondary text-xs font-semibold mb-2">賽季</label><input type="text" placeholder="2026 Q1" value={editingLeague.season} onChange={(e) => setEditingLeague({ ...editingLeague, season: e.target.value })} className={`${inputClass} w-full`} /></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveLeague} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                  <button onClick={() => setEditingLeague(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors">取消</button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-5">
              {/* Col 1: League list */}
              <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
                <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
                  <h2 className="text-bn-ink font-bold text-sm">聯盟 ({leagues.length})</h2>
                </div>
                <div className="divide-y divide-bn-border/50">
                  {leagues.map((l) => {
                    const squadCount = leagueSquadIds.filter((ls) => ls.league_id === l.id).length
                    const isActive = selectedLeagueId === l.id
                    return (
                      <div key={l.id} onClick={() => { setSelectedLeagueId(isActive ? null : l.id); setSelectedLeagueSquadId(null) }}
                        className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                        <div>
                          <p className={`font-semibold text-sm ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{l.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-bn-slate text-xs">{l.region}</span>
                            <span className="text-bn-border">|</span>
                            <span className="text-bn-yellow text-xs font-semibold">{squadCount} 隊</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingLeague({ id: l.id, name: l.name, region: l.region, season: l.season }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteLeague(l.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                        </div>
                      </div>
                    )
                  })}
                  {leagues.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">尚未建立聯盟</p>}
                </div>
              </div>

              {/* Col 2: Squads in league */}
              <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
                <div className="px-5 py-3 border-b border-bn-border bg-bn-snow flex items-center justify-between">
                  <h2 className="text-bn-ink font-bold text-sm">
                    {selectedLeagueId ? '參賽隊伍' : '隊伍'}
                  </h2>
                  {selectedLeagueId && (
                    <span className="text-bn-slate text-xs">{leagueSquadIds.filter((ls) => ls.league_id === selectedLeagueId).length} 隊</span>
                  )}
                </div>
                {!selectedLeagueId ? (
                  <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇聯盟</p>
                ) : (() => {
                  const memberSquadIds = new Set(leagueSquadIds.filter((ls) => ls.league_id === selectedLeagueId).map((ls) => ls.squad_id))
                  const memberSquads = squads.filter((s) => memberSquadIds.has(s.id))
                  const availableSquads = squads.filter((s) => !memberSquadIds.has(s.id))
                  return (
                    <div>
                      <div className="divide-y divide-bn-border/50">
                        {memberSquads.map((s) => {
                          const org = orgs.find((o) => o.id === s.org_id)
                          const rosterCount = leagueRosters.filter((r) => r.league_id === selectedLeagueId && r.squad_id === s.id).length
                          const isActive = selectedLeagueSquadId === s.id
                          return (
                            <div key={s.id} onClick={() => setSelectedLeagueSquadId(isActive ? null : s.id)}
                              className={`px-5 py-3 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                              <div>
                                <span className={`text-sm font-semibold ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{s.name}</span>
                                <span className="text-bn-slate text-xs ml-2">{org?.short_name}</span>
                                <span className="text-bn-muted text-xs ml-2">{rosterCount} 人</span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); removeSquadFromLeague(selectedLeagueId!, s.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">移除</button>
                            </div>
                          )
                        })}
                        {memberSquads.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚未加入隊伍</p>}
                      </div>
                      {availableSquads.length > 0 && (
                        <div className="border-t border-bn-border p-4">
                          <p className="text-bn-secondary text-xs font-semibold mb-2">新增隊伍</p>
                          <div className="flex gap-2">
                            <select id="add-squad-select" className={`${inputClass} flex-1`} defaultValue="">
                              <option value="" disabled>-- 選擇 --</option>
                              {availableSquads.map((s) => {
                                const org = orgs.find((o) => o.id === s.org_id)
                                return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option>
                              })}
                            </select>
                            <button onClick={() => { const el = document.getElementById('add-squad-select') as HTMLSelectElement; if (el?.value) { addSquadToLeague(selectedLeagueId!, el.value); el.value = '' } }}
                              className="px-4 py-2.5 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">加入</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Col 3: Roster for selected squad in league */}
              <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
                <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
                  <h2 className="text-bn-ink font-bold text-sm">
                    {selectedLeagueSquadId ? `${squads.find((s) => s.id === selectedLeagueSquadId)?.name} 名單` : '參賽名單'}
                  </h2>
                </div>
                {!selectedLeagueId || !selectedLeagueSquadId ? (
                  <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇隊伍</p>
                ) : (() => {
                  const rosterEntries = leagueRosters.filter((r) => r.league_id === selectedLeagueId && r.squad_id === selectedLeagueSquadId)
                  const rosterPlayerIds = new Set(rosterEntries.map((r) => r.player_id))
                  const squadAllPlayers = players.filter((p) => p.squad_id === selectedLeagueSquadId)
                  const availablePlayers = squadAllPlayers.filter((p) => !rosterPlayerIds.has(p.id))
                  return (
                    <div>
                      <div className="divide-y divide-bn-border/50">
                        {rosterEntries.map((r) => {
                          const player = players.find((p) => p.id === r.player_id)
                          if (!player) return null
                          return (
                            <div key={r.player_id} className="px-5 py-3 flex items-center justify-between group hover:bg-bn-snow transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-bn-yellow text-xs w-8 text-center">#{r.jersey_number || player.number}</span>
                                <span className="text-bn-ink text-sm font-medium">{player.name}</span>
                              </div>
                              <button onClick={() => removePlayerFromRoster(selectedLeagueId!, selectedLeagueSquadId!, r.player_id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">移除</button>
                            </div>
                          )
                        })}
                        {rosterEntries.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚未加入球員</p>}
                      </div>
                      {availablePlayers.length > 0 && (
                        <div className="border-t border-bn-border p-4">
                          <p className="text-bn-secondary text-xs font-semibold mb-2">新增球員到名單</p>
                          <div className="flex gap-2">
                            <select id="add-roster-player" className={`${inputClass} flex-1`} defaultValue="">
                              <option value="" disabled>-- 選擇球員 --</option>
                              {availablePlayers.map((p) => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
                            </select>
                            <button onClick={() => {
                              const el = document.getElementById('add-roster-player') as HTMLSelectElement
                              if (el?.value) {
                                const p = players.find((pl) => pl.id === el.value)
                                addPlayerToRoster(selectedLeagueId!, selectedLeagueSquadId!, el.value, p?.number ?? '')
                                el.value = ''
                              }
                            }} className="px-4 py-2.5 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">加入</button>
                          </div>
                          {squadAllPlayers.length === 0 && (
                            <p className="text-bn-muted text-[10px] mt-2">此小隊尚無球員，請先到「隊伍管理」新增</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ===== Teams Tab ===== */}
        {tab === 'teams' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-bn-ink">隊伍管理</h1>
            <div className="grid md:grid-cols-3 gap-5">
              {/* Column 1: Organizations */}
              <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
                <div className="px-5 py-3 border-b border-bn-border flex items-center justify-between bg-bn-snow">
                  <h2 className="text-bn-ink font-bold text-sm">隊伍 ({orgs.length})</h2>
                  <button onClick={() => setEditingOrg({ id: null, name: '', short_name: '' })} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>
                </div>
                {editingOrg && (
                  <div className="p-4 border-b border-bn-border bg-bn-snow/50 space-y-2">
                    <input type="text" placeholder="隊伍名稱" value={editingOrg.name} onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })} className={`${inputClass} w-full`} autoFocus />
                    <input type="text" placeholder="簡稱" value={editingOrg.short_name} onChange={(e) => setEditingOrg({ ...editingOrg, short_name: e.target.value })} className={`${inputClass} w-full`} />
                    <div className="flex gap-2">
                      <button onClick={saveOrg} className="px-4 py-2 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                      <button onClick={() => setEditingOrg(null)} className="px-4 py-2 rounded-[6px] text-xs font-semibold text-bn-slate hover:text-bn-ink transition-colors">取消</button>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-bn-border/50">
                  {orgs.map((org) => (
                    <div key={org.id} onClick={() => { setSelectedOrgId(org.id); setSelectedSquadId(null) }}
                      className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-colors ${selectedOrgId === org.id ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                      <div>
                        <p className={`font-semibold text-sm ${selectedOrgId === org.id ? 'text-bn-yellow' : 'text-bn-ink'}`}>{org.name}</p>
                        {org.short_name && <p className="text-bn-slate text-xs mt-0.5">{org.short_name}</p>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingOrg({ id: org.id, name: org.name, short_name: org.short_name }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteOrg(org.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                      </div>
                    </div>
                  ))}
                  {orgs.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">點擊上方新增隊伍</p>}
                </div>
              </div>

              {/* Column 2: Squads */}
              <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
                <div className="px-5 py-3 border-b border-bn-border flex items-center justify-between bg-bn-snow">
                  <h2 className="text-bn-ink font-bold text-sm">
                    {selectedOrgId ? `${orgs.find((o) => o.id === selectedOrgId)?.short_name ?? ''} 小隊` : '小隊'}
                  </h2>
                  {selectedOrgId && <button onClick={() => setEditingSquad({ id: null, org_id: selectedOrgId, name: '', age_group: '' })} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>}
                </div>
                {editingSquad && (
                  <div className="p-4 border-b border-bn-border bg-bn-snow/50 space-y-2">
                    <input type="text" placeholder="小隊名稱" value={editingSquad.name} onChange={(e) => setEditingSquad({ ...editingSquad, name: e.target.value })} className={`${inputClass} w-full`} autoFocus />
                    <input type="text" placeholder="分組 (U12)" value={editingSquad.age_group} onChange={(e) => setEditingSquad({ ...editingSquad, age_group: e.target.value })} className={`${inputClass} w-full`} />
                    <div className="flex gap-2">
                      <button onClick={saveSquad} className="px-4 py-2 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                      <button onClick={() => setEditingSquad(null)} className="px-4 py-2 rounded-[6px] text-xs font-semibold text-bn-slate hover:text-bn-ink transition-colors">取消</button>
                    </div>
                  </div>
                )}
                {!selectedOrgId ? (
                  <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇左側隊伍</p>
                ) : (
                  <div className="divide-y divide-bn-border/50">
                    {orgSquads.map((squad) => (
                      <div key={squad.id} onClick={() => setSelectedSquadId(squad.id)}
                        className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-colors ${selectedSquadId === squad.id ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                        <div>
                          <p className={`font-semibold text-sm ${selectedSquadId === squad.id ? 'text-bn-yellow' : 'text-bn-ink'}`}>{squad.name}</p>
                          <p className="text-bn-slate text-xs mt-0.5">{squad.age_group}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingSquad({ id: squad.id, org_id: squad.org_id, name: squad.name, age_group: squad.age_group }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteSquad(squad.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                        </div>
                      </div>
                    ))}
                    {orgSquads.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">點擊上方新增小隊</p>}
                  </div>
                )}
              </div>

              {/* Column 3: Players */}
              <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
                <div className="px-5 py-3 border-b border-bn-border flex items-center justify-between bg-bn-snow">
                  <h2 className="text-bn-ink font-bold text-sm">球員 {selectedSquadId ? `(${squadPlayers.length})` : ''}</h2>
                  {selectedSquadId && <button onClick={() => setEditingPlayer({ id: null, squad_id: selectedSquadId, number: '', name: '' })} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>}
                </div>
                {editingPlayer && (
                  <div className="p-4 border-b border-bn-border bg-bn-snow/50 space-y-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="#" value={editingPlayer.number} onChange={(e) => setEditingPlayer({ ...editingPlayer, number: e.target.value })} className={`${inputClass} w-16 text-center`} />
                      <input type="text" placeholder="球員姓名" value={editingPlayer.name} onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })} className={`${inputClass} flex-1`} autoFocus />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={savePlayer} className="px-4 py-2 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
                      <button onClick={() => setEditingPlayer(null)} className="px-4 py-2 rounded-[6px] text-xs font-semibold text-bn-slate hover:text-bn-ink transition-colors">取消</button>
                    </div>
                  </div>
                )}
                {!selectedSquadId ? (
                  <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇左側小隊</p>
                ) : (
                  <div className="divide-y divide-bn-border/50">
                    {squadPlayers.map((player) => (
                      <div key={player.id} className="px-5 py-3.5 flex items-center justify-between group hover:bg-bn-snow transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-bn-yellow text-xs w-8 text-center">#{player.number}</span>
                          <span className="text-bn-ink text-sm font-medium">{player.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingPlayer({ id: player.id, squad_id: player.squad_id, number: player.number, name: player.name })} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                          <button onClick={() => deletePlayer(player.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                        </div>
                      </div>
                    ))}
                    {squadPlayers.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">點擊上方新增球員</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
