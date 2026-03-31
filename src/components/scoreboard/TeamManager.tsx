'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Organization, Squad, DbPlayer } from '@/lib/scoreboard-types'

interface TeamManagerProps {
  onBack: () => void
}

type EditingOrg = { id: string | null; name: string; short_name: string }
type EditingSquad = { id: string | null; org_id: string; name: string; age_group: string }
type EditingPlayer = { id: string | null; squad_id: string; number: string; name: string }

export function TeamManager({ onBack }: TeamManagerProps) {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [players, setPlayers] = useState<DbPlayer[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [editingOrg, setEditingOrg] = useState<EditingOrg | null>(null)
  const [editingSquad, setEditingSquad] = useState<EditingSquad | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayer | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

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

  const orgSquads = squads.filter((s) => s.org_id === selectedOrgId)
  const squadPlayers = players.filter((p) => p.squad_id === selectedSquadId)

  // --- Org CRUD ---
  const saveOrg = async () => {
    if (!editingOrg || !editingOrg.name.trim()) return
    if (editingOrg.id) {
      await supabase.from('sb_organizations').update({
        name: editingOrg.name,
        short_name: editingOrg.short_name,
      }).eq('id', editingOrg.id)
    } else {
      await supabase.from('sb_organizations').insert({
        name: editingOrg.name,
        short_name: editingOrg.short_name,
      })
    }
    setEditingOrg(null)
    showToast('已儲存')
    await reload()
  }

  const deleteOrg = async (id: string) => {
    await supabase.from('sb_organizations').delete().eq('id', id)
    if (selectedOrgId === id) {
      setSelectedOrgId(null)
      setSelectedSquadId(null)
    }
    showToast('已刪除')
    await reload()
  }

  // --- Squad CRUD ---
  const saveSquad = async () => {
    if (!editingSquad || !editingSquad.name.trim() || !editingSquad.org_id) return
    if (editingSquad.id) {
      await supabase.from('sb_squads').update({
        name: editingSquad.name,
        age_group: editingSquad.age_group,
      }).eq('id', editingSquad.id)
    } else {
      await supabase.from('sb_squads').insert({
        org_id: editingSquad.org_id,
        name: editingSquad.name,
        age_group: editingSquad.age_group,
      })
    }
    setEditingSquad(null)
    showToast('已儲存')
    await reload()
  }

  const deleteSquad = async (id: string) => {
    await supabase.from('sb_squads').delete().eq('id', id)
    if (selectedSquadId === id) setSelectedSquadId(null)
    showToast('已刪除')
    await reload()
  }

  // --- Player CRUD ---
  const savePlayer = async () => {
    if (!editingPlayer || !editingPlayer.name.trim() || !editingPlayer.squad_id) return
    if (editingPlayer.id) {
      await supabase.from('sb_players').update({
        number: editingPlayer.number,
        name: editingPlayer.name,
      }).eq('id', editingPlayer.id)
    } else {
      await supabase.from('sb_players').insert({
        squad_id: editingPlayer.squad_id,
        number: editingPlayer.number,
        name: editingPlayer.name,
      })
    }
    setEditingPlayer(null)
    showToast('已儲存')
    await reload()
  }

  const deletePlayer = async (id: string) => {
    await supabase.from('sb_players').delete().eq('id', id)
    showToast('已刪除')
    await reload()
  }

  const inputClass = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-gold/50'

  return (
    <div className="min-h-screen bg-navy p-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-pulse">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">隊伍管理</h1>
          <button
            onClick={onBack}
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            返回紀錄台
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Column 1: Organizations */}
          <div className="bg-navy-light border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gold/10">
              <h2 className="text-gold font-bold text-sm">隊伍</h2>
              <button
                onClick={() => setEditingOrg({ id: null, name: '', short_name: '' })}
                className="text-gold text-xs hover:text-gold-dark transition-colors"
              >
                + 新增
              </button>
            </div>

            {editingOrg && (
              <div className="p-3 border-b border-white/10 bg-white/5 space-y-2">
                <input
                  type="text"
                  placeholder="隊伍名稱（如：黑熊隊）"
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className={`${inputClass} w-full`}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="簡稱（如：黑熊）"
                  value={editingOrg.short_name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, short_name: e.target.value })}
                  className={`${inputClass} w-full`}
                />
                <div className="flex gap-2">
                  <button onClick={saveOrg} className="bg-gold text-navy px-3 py-1 rounded text-xs font-bold hover:bg-gold-dark transition-colors">
                    儲存
                  </button>
                  <button onClick={() => setEditingOrg(null)} className="text-white/40 text-xs hover:text-white transition-colors">
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-white/5">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  onClick={() => { setSelectedOrgId(org.id); setSelectedSquadId(null) }}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${
                    selectedOrgId === org.id ? 'bg-gold/10 text-gold' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{org.name}</p>
                    {org.short_name && <p className="text-xs text-white/30">{org.short_name}</p>}
                  </div>
                  <div className="hidden group-hover:flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingOrg({ id: org.id, name: org.name, short_name: org.short_name }) }}
                      className="text-white/30 hover:text-gold text-xs transition-colors"
                    >
                      編輯
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOrg(org.id) }}
                      className="text-white/30 hover:text-red-400 text-xs transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
              {orgs.length === 0 && (
                <p className="px-4 py-6 text-white/20 text-sm text-center">尚未建立隊伍</p>
              )}
            </div>
          </div>

          {/* Column 2: Squads */}
          <div className="bg-navy-light border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-white font-bold text-sm">
                {selectedOrgId ? `${orgs.find((o) => o.id === selectedOrgId)?.name} — 小隊` : '小隊'}
              </h2>
              {selectedOrgId && (
                <button
                  onClick={() => setEditingSquad({ id: null, org_id: selectedOrgId, name: '', age_group: '' })}
                  className="text-gold text-xs hover:text-gold-dark transition-colors"
                >
                  + 新增
                </button>
              )}
            </div>

            {editingSquad && (
              <div className="p-3 border-b border-white/10 bg-white/5 space-y-2">
                <input
                  type="text"
                  placeholder="小隊名稱（如：黑熊 U12）"
                  value={editingSquad.name}
                  onChange={(e) => setEditingSquad({ ...editingSquad, name: e.target.value })}
                  className={`${inputClass} w-full`}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="年齡分組（如：U12）"
                  value={editingSquad.age_group}
                  onChange={(e) => setEditingSquad({ ...editingSquad, age_group: e.target.value })}
                  className={`${inputClass} w-full`}
                />
                <div className="flex gap-2">
                  <button onClick={saveSquad} className="bg-gold text-navy px-3 py-1 rounded text-xs font-bold hover:bg-gold-dark transition-colors">
                    儲存
                  </button>
                  <button onClick={() => setEditingSquad(null)} className="text-white/40 text-xs hover:text-white transition-colors">
                    取消
                  </button>
                </div>
              </div>
            )}

            {!selectedOrgId ? (
              <p className="px-4 py-6 text-white/20 text-sm text-center">請先選擇隊伍</p>
            ) : (
              <div className="divide-y divide-white/5">
                {orgSquads.map((squad) => (
                  <div
                    key={squad.id}
                    onClick={() => setSelectedSquadId(squad.id)}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${
                      selectedSquadId === squad.id ? 'bg-gold/10 text-gold' : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{squad.name}</p>
                      <p className="text-xs text-white/30">{squad.age_group}</p>
                    </div>
                    <div className="hidden group-hover:flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSquad({ id: squad.id, org_id: squad.org_id, name: squad.name, age_group: squad.age_group }) }}
                        className="text-white/30 hover:text-gold text-xs transition-colors"
                      >
                        編輯
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSquad(squad.id) }}
                        className="text-white/30 hover:text-red-400 text-xs transition-colors"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
                {orgSquads.length === 0 && (
                  <p className="px-4 py-6 text-white/20 text-sm text-center">尚未建立小隊</p>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Players */}
          <div className="bg-navy-light border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-white font-bold text-sm">
                {selectedSquadId ? `${squads.find((s) => s.id === selectedSquadId)?.name} — 球員` : '球員'}
              </h2>
              {selectedSquadId && (
                <button
                  onClick={() => setEditingPlayer({ id: null, squad_id: selectedSquadId, number: '', name: '' })}
                  className="text-gold text-xs hover:text-gold-dark transition-colors"
                >
                  + 新增
                </button>
              )}
            </div>

            {editingPlayer && (
              <div className="p-3 border-b border-white/10 bg-white/5 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="#"
                    value={editingPlayer.number}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, number: e.target.value })}
                    className={`${inputClass} w-16 text-center`}
                  />
                  <input
                    type="text"
                    placeholder="球員姓名"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className={`${inputClass} flex-1`}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={savePlayer} className="bg-gold text-navy px-3 py-1 rounded text-xs font-bold hover:bg-gold-dark transition-colors">
                    儲存
                  </button>
                  <button onClick={() => setEditingPlayer(null)} className="text-white/40 text-xs hover:text-white transition-colors">
                    取消
                  </button>
                </div>
              </div>
            )}

            {!selectedSquadId ? (
              <p className="px-4 py-6 text-white/20 text-sm text-center">請先選擇小隊</p>
            ) : (
              <div className="divide-y divide-white/5">
                {squadPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="px-4 py-3 flex items-center justify-between group text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gold text-sm w-8 text-center">
                        #{player.number}
                      </span>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <div className="hidden group-hover:flex gap-2">
                      <button
                        onClick={() => setEditingPlayer({ id: player.id, squad_id: player.squad_id, number: player.number, name: player.name })}
                        className="text-white/30 hover:text-gold text-xs transition-colors"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="text-white/30 hover:text-red-400 text-xs transition-colors"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
                {squadPlayers.length === 0 && (
                  <p className="px-4 py-6 text-white/20 text-sm text-center">尚未建立球員</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
