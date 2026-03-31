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

  const saveOrg = async () => {
    if (!editingOrg || !editingOrg.name.trim()) return
    if (editingOrg.id) {
      await supabase.from('sb_organizations').update({
        name: editingOrg.name, short_name: editingOrg.short_name,
      }).eq('id', editingOrg.id)
    } else {
      await supabase.from('sb_organizations').insert({
        name: editingOrg.name, short_name: editingOrg.short_name,
      })
    }
    setEditingOrg(null)
    showToast('已儲存')
    await reload()
  }

  const deleteOrg = async (id: string) => {
    await supabase.from('sb_organizations').delete().eq('id', id)
    if (selectedOrgId === id) { setSelectedOrgId(null); setSelectedSquadId(null) }
    showToast('已刪除')
    await reload()
  }

  const saveSquad = async () => {
    if (!editingSquad || !editingSquad.name.trim() || !editingSquad.org_id) return
    if (editingSquad.id) {
      await supabase.from('sb_squads').update({
        name: editingSquad.name, age_group: editingSquad.age_group,
      }).eq('id', editingSquad.id)
    } else {
      await supabase.from('sb_squads').insert({
        org_id: editingSquad.org_id, name: editingSquad.name, age_group: editingSquad.age_group,
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

  const savePlayer = async () => {
    if (!editingPlayer || !editingPlayer.name.trim() || !editingPlayer.squad_id) return
    if (editingPlayer.id) {
      await supabase.from('sb_players').update({
        number: editingPlayer.number, name: editingPlayer.name,
      }).eq('id', editingPlayer.id)
    } else {
      await supabase.from('sb_players').insert({
        squad_id: editingPlayer.squad_id, number: editingPlayer.number, name: editingPlayer.name,
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

  const inputClass = 'bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-all'

  const renderEditForm = (
    fields: { placeholder: string; value: string; onChange: (v: string) => void; className?: string }[],
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div className="p-4 border-b border-white/[0.04] bg-white/[0.02] space-y-3">
      <div className="flex gap-2">
        {fields.map((f, i) => (
          <input
            key={i}
            type="text"
            placeholder={f.placeholder}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className={`${inputClass} ${f.className ?? 'flex-1'}`}
            autoFocus={i === 0}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 rounded-xl text-xs font-bold bg-gold text-navy hover:bg-gold-dark transition-colors">
          儲存
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white/40 transition-colors">
          取消
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060f1d] p-4 sm:p-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 font-semibold text-sm">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">隊伍管理</h1>
            <p className="text-white/25 text-sm mt-1">管理所有隊伍、小隊與球員名單</p>
          </div>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-full text-sm font-bold bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 border border-white/[0.06] transition-all"
          >
            返回紀錄台
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Column 1: Organizations */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="px-5 py-4 flex items-center justify-between bg-gold/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-gold" />
                <h2 className="text-gold font-bold text-sm tracking-wide">隊伍</h2>
                <span className="text-gold/30 text-xs">({orgs.length})</span>
              </div>
              <button
                onClick={() => setEditingOrg({ id: null, name: '', short_name: '' })}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gold/10 hover:bg-gold/20 text-gold/70 hover:text-gold border border-gold/10 transition-all"
              >
                + 新增
              </button>
            </div>

            {editingOrg && renderEditForm(
              [
                { placeholder: '隊伍名稱', value: editingOrg.name, onChange: (v) => setEditingOrg({ ...editingOrg, name: v }) },
                { placeholder: '簡稱', value: editingOrg.short_name, onChange: (v) => setEditingOrg({ ...editingOrg, short_name: v }), className: 'w-24' },
              ],
              saveOrg,
              () => setEditingOrg(null)
            )}

            <div className="divide-y divide-white/[0.04]">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  onClick={() => { setSelectedOrgId(org.id); setSelectedSquadId(null) }}
                  className={`px-5 py-4 cursor-pointer transition-all duration-150 flex items-center justify-between group ${
                    selectedOrgId === org.id ? 'bg-gold/[0.08] text-gold' : 'text-white/60 hover:bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{org.name}</p>
                    {org.short_name && <p className="text-xs text-white/20 mt-0.5">{org.short_name}</p>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingOrg({ id: org.id, name: org.name, short_name: org.short_name }) }}
                      className="px-2 py-1 rounded-md text-[10px] font-bold text-white/20 hover:text-gold hover:bg-gold/10 transition-all"
                    >
                      編輯
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOrg(org.id) }}
                      className="px-2 py-1 rounded-md text-[10px] font-bold text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
              {orgs.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white/10 text-lg">+</span>
                  </div>
                  <p className="text-white/15 text-xs">點擊上方新增隊伍</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Squads */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="px-5 py-4 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-cyan-400/50" />
                <h2 className="text-white/80 font-bold text-sm tracking-wide">
                  {selectedOrgId ? `${orgs.find((o) => o.id === selectedOrgId)?.short_name ?? ''} 小隊` : '小隊'}
                </h2>
                {selectedOrgId && <span className="text-white/20 text-xs">({orgSquads.length})</span>}
              </div>
              {selectedOrgId && (
                <button
                  onClick={() => setEditingSquad({ id: null, org_id: selectedOrgId, name: '', age_group: '' })}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400/70 hover:text-cyan-400 border border-cyan-500/10 transition-all"
                >
                  + 新增
                </button>
              )}
            </div>

            {editingSquad && renderEditForm(
              [
                { placeholder: '小隊名稱', value: editingSquad.name, onChange: (v) => setEditingSquad({ ...editingSquad, name: v }) },
                { placeholder: '分組 (U12)', value: editingSquad.age_group, onChange: (v) => setEditingSquad({ ...editingSquad, age_group: v }), className: 'w-28' },
              ],
              saveSquad,
              () => setEditingSquad(null)
            )}

            {!selectedOrgId ? (
              <div className="px-5 py-10 text-center">
                <p className="text-white/10 text-xs">請先選擇左側隊伍</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {orgSquads.map((squad) => (
                  <div
                    key={squad.id}
                    onClick={() => setSelectedSquadId(squad.id)}
                    className={`px-5 py-4 cursor-pointer transition-all duration-150 flex items-center justify-between group ${
                      selectedSquadId === squad.id ? 'bg-cyan-500/[0.08] text-cyan-300' : 'text-white/60 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{squad.name}</p>
                      <p className="text-xs text-white/20 mt-0.5">{squad.age_group}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSquad({ id: squad.id, org_id: squad.org_id, name: squad.name, age_group: squad.age_group }) }}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                      >
                        編輯
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSquad(squad.id) }}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
                {orgSquads.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <p className="text-white/10 text-xs">點擊上方新增小隊</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Players */}
          <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="px-5 py-4 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-emerald-400/50" />
                <h2 className="text-white/80 font-bold text-sm tracking-wide">
                  {selectedSquadId ? `球員` : '球員'}
                </h2>
                {selectedSquadId && <span className="text-white/20 text-xs">({squadPlayers.length})</span>}
              </div>
              {selectedSquadId && (
                <button
                  onClick={() => setEditingPlayer({ id: null, squad_id: selectedSquadId, number: '', name: '' })}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/70 hover:text-emerald-400 border border-emerald-500/10 transition-all"
                >
                  + 新增
                </button>
              )}
            </div>

            {editingPlayer && renderEditForm(
              [
                { placeholder: '#', value: editingPlayer.number, onChange: (v) => setEditingPlayer({ ...editingPlayer, number: v }), className: 'w-16 text-center' },
                { placeholder: '球員姓名', value: editingPlayer.name, onChange: (v) => setEditingPlayer({ ...editingPlayer, name: v }) },
              ],
              savePlayer,
              () => setEditingPlayer(null)
            )}

            {!selectedSquadId ? (
              <div className="px-5 py-10 text-center">
                <p className="text-white/10 text-xs">請先選擇左側小隊</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {squadPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="px-5 py-3.5 flex items-center justify-between group text-white/60 hover:bg-white/[0.03] transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                        <span className="font-mono font-black text-gold text-xs">
                          {player.number}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{player.name}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingPlayer({ id: player.id, squad_id: player.squad_id, number: player.number, name: player.name })}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
                {squadPlayers.length === 0 && (
                  <div className="px-5 py-10 text-center">
                    <p className="text-white/10 text-xs">點擊上方新增球員</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
