'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { ManagementData } from './types'
import { INPUT_CLASS } from './types'

type Props = {
  data: ManagementData
  reload: () => Promise<void>
  toast: (msg: string) => void
}

interface EditingGame {
  id: string | null
  home_squad_id: string
  away_squad_id: string
  game_date: string
  game_time: string
  location: string
  status: string
  cup_id: string
  season_id: string
}

const newGameTemplate = (): EditingGame => ({
  id: null, home_squad_id: '', away_squad_id: '',
  game_date: new Date().toISOString().split('T')[0],
  game_time: '10:00', location: '', status: 'pending',
  cup_id: '', season_id: '',
})

export function GamesTab({ data, reload, toast }: Props) {
  const { games, orgs, squads, cups, seasons } = data
  const [editingGame, setEditingGame] = useState<EditingGame | null>(null)
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()))
  const [cupFilter, setCupFilter] = useState<string>('ALL')

  const seasonCupMap = new Map(seasons.map((s) => [s.id, s.cup_id]))

  const saveGame = async () => {
    if (!editingGame?.home_squad_id || !editingGame?.away_squad_id) return
    const homeSquad = squads.find((s) => s.id === editingGame.home_squad_id)
    const awaySquad = squads.find((s) => s.id === editingGame.away_squad_id)
    const payload = {
      home_squad_id: editingGame.home_squad_id, away_squad_id: editingGame.away_squad_id,
      home_squad_name: homeSquad?.name ?? '', away_squad_name: awaySquad?.name ?? '',
      game_date: editingGame.game_date, game_time: editingGame.game_time || null,
      location: editingGame.location, status: editingGame.status,
      season_id: editingGame.season_id || null,
    }
    if (editingGame.id) await supabase.from('sb_games').update(payload).eq('id', editingGame.id)
    else await supabase.from('sb_games').insert(payload)
    setEditingGame(null); toast('已儲存'); await reload()
  }

  const deleteGame = async (id: string) => {
    await supabase.from('sb_games').delete().eq('id', id)
    toast('已刪除'); await reload()
  }

  const filtered = games.filter((g) => {
    const year = g.game_date.split('-')[0]
    if (yearFilter !== 'ALL' && year !== yearFilter) return false
    if (cupFilter !== 'ALL') {
      const cupId = g.season_id ? seasonCupMap.get(g.season_id) : null
      if (cupId !== cupFilter) return false
    }
    return true
  })

  const pendingGames = filtered.filter((g) => g.status === 'pending' || g.status === 'scheduled')
  const completedGames = filtered.filter((g) => g.status === 'completed')
  const gameYears = [...new Set(games.map((g) => g.game_date.split('-')[0]))].sort().reverse()

  const cupSeasonOptions = editingGame?.cup_id ? seasons.filter((s) => s.cup_id === editingGame.cup_id) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-bn-ink">賽程管理</h1>
        <button onClick={() => setEditingGame(newGameTemplate())} className="px-5 py-2.5 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">+ 新增比賽</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="text-sm border border-bn-border rounded-[6px] px-3 py-2 bg-white text-bn-ink font-medium focus:outline-none focus:border-bn-yellow">
          <option value="ALL">全部年份</option>
          {gameYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={cupFilter} onChange={(e) => setCupFilter(e.target.value)} className="text-sm border border-bn-border rounded-[6px] px-3 py-2 bg-white text-bn-ink font-medium focus:outline-none focus:border-bn-yellow">
          <option value="ALL">全部盃賽</option>
          {cups.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-bn-slate text-xs">{filtered.length} 場比賽</span>
      </div>

      {editingGame && (
        <div className="rounded-[12px] bg-white border border-bn-yellow/30 p-6">
          <h3 className="text-bn-ink font-bold text-sm mb-4">{editingGame.id ? '編輯比賽' : '新增比賽'}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-bn-secondary text-xs font-semibold mb-2">日期</label><input type="date" value={editingGame.game_date} onChange={(e) => setEditingGame({ ...editingGame, game_date: e.target.value })} className={`${INPUT_CLASS} w-full`} /></div>
            <div><label className="block text-bn-secondary text-xs font-semibold mb-2">時間</label><input type="time" value={editingGame.game_time} onChange={(e) => setEditingGame({ ...editingGame, game_time: e.target.value })} className={`${INPUT_CLASS} w-full`} /></div>
            <div><label className="block text-bn-secondary text-xs font-semibold mb-2">地點</label><input type="text" placeholder="比賽場地" value={editingGame.location} onChange={(e) => setEditingGame({ ...editingGame, location: e.target.value })} className={`${INPUT_CLASS} w-full`} /></div>
            <div>
              <label className="block text-bn-secondary text-xs font-semibold mb-2">盃賽</label>
              <select value={editingGame.cup_id} onChange={(e) => setEditingGame({ ...editingGame, cup_id: e.target.value, season_id: '' })} className={`${INPUT_CLASS} w-full`}>
                <option value="">-- 不指定 --</option>
                {cups.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-bn-secondary text-xs font-semibold mb-2">賽季</label>
              <select value={editingGame.season_id} onChange={(e) => setEditingGame({ ...editingGame, season_id: e.target.value })} className={`${INPUT_CLASS} w-full`} disabled={!editingGame.cup_id}>
                <option value="">{editingGame.cup_id ? '-- 選擇賽季 --' : '請先選擇盃賽'}</option>
                {cupSeasonOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-bn-secondary text-xs font-semibold mb-2">狀態</label>
              <select value={editingGame.status} onChange={(e) => setEditingGame({ ...editingGame, status: e.target.value })} className={`${INPUT_CLASS} w-full`}>
                <option value="pending">未開始</option>
                <option value="scheduled">已排定</option>
                <option value="live">進行中</option>
                <option value="completed">已結束</option>
              </select>
            </div>
            <div>
              <label className="block text-bn-secondary text-xs font-semibold mb-2">主隊</label>
              <select value={editingGame.home_squad_id} onChange={(e) => setEditingGame({ ...editingGame, home_squad_id: e.target.value })} className={`${INPUT_CLASS} w-full`}>
                <option value="">-- 選擇 --</option>
                {squads.map((s) => { const org = orgs.find((o) => o.id === s.org_id); return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option> })}
              </select>
            </div>
            <div>
              <label className="block text-bn-secondary text-xs font-semibold mb-2">客隊</label>
              <select value={editingGame.away_squad_id} onChange={(e) => setEditingGame({ ...editingGame, away_squad_id: e.target.value })} className={`${INPUT_CLASS} w-full`}>
                <option value="">-- 選擇 --</option>
                {squads.map((s) => { const org = orgs.find((o) => o.id === s.org_id); return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option> })}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveGame} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
            <button onClick={() => setEditingGame(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors">取消</button>
          </div>
        </div>
      )}

      <GameSection title={`待開始 (${pendingGames.length})`} games={pendingGames} cups={cups} seasons={seasons} seasonCupMap={seasonCupMap} emptyText="沒有排定的比賽"
        renderActions={(g) => (
          <>
            <Link href={`/management/game/${g.id}`} className="px-4 py-1.5 rounded-[50px] text-xs font-bold bg-bn-green text-white hover:opacity-80 transition-opacity">開始記錄</Link>
            <button onClick={() => setEditingGame({
              id: g.id, home_squad_id: g.home_squad_id, away_squad_id: g.away_squad_id,
              game_date: g.game_date, game_time: g.game_time ?? '', location: g.location, status: g.status,
              cup_id: g.season_id ? (seasonCupMap.get(g.season_id) ?? '') : '',
              season_id: g.season_id ?? '',
            })} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
            <button onClick={() => deleteGame(g.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
          </>
        )}
      />

      <GameSection title={`已結束 (${completedGames.length})`} games={completedGames} cups={cups} seasons={seasons} seasonCupMap={seasonCupMap} emptyText="沒有已結束的比賽" showScore
        renderActions={(g) => (
          <>
            <Link href={`/games/${g.id}`} className="text-bn-slate hover:text-bn-focus text-xs font-semibold transition-colors">數據</Link>
            <button onClick={() => deleteGame(g.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
          </>
        )}
      />
    </div>
  )
}

function GameSection({ title, games, cups, seasons, seasonCupMap, emptyText, showScore, renderActions }: {
  title: string
  games: ManagementData['games']
  cups: ManagementData['cups']
  seasons: ManagementData['seasons']
  seasonCupMap: Map<string, string>
  emptyText: string
  showScore?: boolean
  renderActions: (g: ManagementData['games'][number]) => React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-bn-ink mb-3">{title}</h2>
      {games.length === 0 ? (
        <div className="rounded-[12px] bg-white border border-bn-border p-6 text-center"><p className="text-bn-slate text-sm">{emptyText}</p></div>
      ) : (
        <div className="space-y-2">
          {games.map((g) => {
            const cupId = g.season_id ? seasonCupMap.get(g.season_id) : null
            const cup = cupId ? cups.find((c) => c.id === cupId) : null
            const season = g.season_id ? seasons.find((s) => s.id === g.season_id) : null
            const homeWin = g.home_score > g.away_score
            return (
              <div key={g.id} className="rounded-[8px] bg-white border border-bn-border px-5 py-3 flex items-center justify-between group hover:border-bn-yellow/30 transition-colors">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="text-bn-slate tabular-nums w-24">{g.game_date}</span>
                  {!showScore && <span className="text-bn-slate w-14">{g.game_time ?? '-'}</span>}
                  {cup && <span className="text-xs text-bn-slate bg-bn-snow px-2 py-0.5 rounded">{cup.name}</span>}
                  {season && <span className="text-xs text-bn-blue bg-bn-blue/10 px-2 py-0.5 rounded font-medium">{season.name}</span>}
                  {showScore ? (
                    <>
                      <span className={`font-semibold ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_squad_name}</span>
                      <span className={`font-bold tabular-nums ${homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.home_score}</span>
                      <span className="text-bn-border">-</span>
                      <span className={`font-bold tabular-nums ${!homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_score}</span>
                      <span className={`font-semibold ${!homeWin ? 'text-bn-ink' : 'text-bn-slate'}`}>{g.away_squad_name}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-bn-ink font-semibold">{g.home_squad_name}</span>
                      <span className="text-bn-border text-xs">vs</span>
                      <span className="text-bn-ink font-semibold">{g.away_squad_name}</span>
                    </>
                  )}
                </div>
                <div className={`flex gap-2 items-center ${showScore ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                  {renderActions(g)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
