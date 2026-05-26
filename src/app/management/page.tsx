'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { OrgsPlayersTab } from './_components/OrgsPlayersTab'
import { CupsSeasonsTab } from './_components/CupsSeasonsTab'
import { GamesTab } from './_components/GamesTab'
import { INPUT_CLASS, type ManagementData } from './_components/types'

type Tab = 'orgsPlayers' | 'cupsSeasons' | 'games'
const ADMIN_PASSWORD = 'empower2026'

const EMPTY_DATA: ManagementData = {
  orgs: [], squads: [], players: [],
  cups: [], seasons: [],
  squadPlayerLinks: [], seasonSquadLinks: [], seasonRosters: [],
  playerOrgLinks: [],
  games: [],
}

export default function ManagementPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<Tab>('cupsSeasons')
  const [data, setData] = useState<ManagementData>(EMPTY_DATA)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('empower_authed') === '1') setAuthed(true)
  }, [])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2000)
  }, [])

  const reload = useCallback(async () => {
    const [o, s, p, c, ss, sp, sq, sr, po, g] = await Promise.all([
      supabase.from('sb_organizations').select('*').order('name'),
      supabase.from('sb_squads').select('*').order('name'),
      supabase.from('sb_players').select('*').order('number'),
      supabase.from('sb_cups').select('*').order('name'),
      supabase.from('sb_seasons').select('*').order('year', { ascending: false }),
      supabase.from('sb_squad_players').select('squad_id,player_id,jersey_number'),
      supabase.from('sb_season_squads').select('season_id,squad_id'),
      supabase.from('sb_season_rosters').select('season_id,squad_id,player_id,jersey_number'),
      supabase.from('sb_player_orgs').select('player_id,org_id'),
      supabase.from('sb_games').select('*').order('game_date', { ascending: false }),
    ])
    setData({
      orgs: o.data ?? [],
      squads: s.data ?? [],
      players: p.data ?? [],
      cups: c.data ?? [],
      seasons: ss.data ?? [],
      squadPlayerLinks: sp.data ?? [],
      seasonSquadLinks: sq.data ?? [],
      seasonRosters: sr.data ?? [],
      playerOrgLinks: po.data ?? [],
      games: g.data ?? [],
    })
  }, [])

  useEffect(() => { if (authed) reload() }, [authed, reload])

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); sessionStorage.setItem('empower_authed', '1'); setPwError(false) }
    else setPwError(true)
  }

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
                  className={`${INPUT_CLASS} w-full ${pwError ? 'border-bn-red' : ''}`} placeholder="輸入管理密碼" autoFocus />
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orgsPlayers', label: '組織與球員' },
    { key: 'cupsSeasons', label: '盃賽與名冊' },
    { key: 'games', label: '賽程管理' },
  ]

  return (
    <div className="min-h-screen bg-bn-snow">
      {toastMsg && <div className="fixed top-4 right-4 z-50 bg-bn-green text-white px-5 py-2.5 rounded-[8px] shadow-lg font-semibold text-sm">{toastMsg}</div>}

      <header className="bg-white border-b border-bn-border px-4 py-3 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-bn-yellow font-bold text-lg tracking-wider">EMPOWER</Link>
            <span className="text-bn-border">|</span>
            <span className="text-bn-secondary text-sm font-semibold">賽事管理</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-bn-secondary hover:text-bn-ink text-sm font-medium transition-colors">回首頁</Link>
            <button onClick={() => { setAuthed(false); sessionStorage.removeItem('empower_authed') }} className="text-bn-slate hover:text-bn-ink text-sm transition-colors">登出</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6">
        <div className="flex items-center gap-2 mb-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${tab === t.key ? 'bg-bn-yellow text-bn-ink' : 'bg-white text-bn-secondary hover:bg-bn-border/40 border border-bn-border'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'orgsPlayers' && <OrgsPlayersTab data={data} reload={reload} toast={toast} />}
        {tab === 'cupsSeasons' && <CupsSeasonsTab data={data} reload={reload} toast={toast} />}
        {tab === 'games' && <GamesTab data={data} reload={reload} toast={toast} />}
      </div>
    </div>
  )
}
