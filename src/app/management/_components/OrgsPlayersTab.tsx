'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ManagementData, Organization, Squad, DbPlayer } from './types'
import { INPUT_CLASS } from './types'
import { LogoUpload } from './LogoUpload'

type Props = {
  data: ManagementData
  reload: () => Promise<void>
  toast: (msg: string) => void
}

type Mode = 'squads' | 'players'

interface EditingOrg { id: string | null; name: string; short_name: string; logo_url: string }
interface EditingSquad { id: string | null; org_id: string; name: string; age_group: string }
interface EditingPlayer { id: string | null; name: string; number: string; birthday: string; org_id: string }

export function OrgsPlayersTab({ data, reload, toast }: Props) {
  const [mode, setMode] = useState<Mode>('squads')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  const [editingOrg, setEditingOrg] = useState<EditingOrg | null>(null)
  const [editingSquad, setEditingSquad] = useState<EditingSquad | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<EditingPlayer | null>(null)

  const { orgs, squads, players, squadPlayerLinks } = data

  // --- CRUD ---
  const saveOrg = async () => {
    if (!editingOrg?.name.trim()) return
    const payload = { name: editingOrg.name, short_name: editingOrg.short_name, logo_url: editingOrg.logo_url }
    if (editingOrg.id) await supabase.from('sb_organizations').update(payload).eq('id', editingOrg.id)
    else await supabase.from('sb_organizations').insert(payload)
    setEditingOrg(null); toast('已儲存'); await reload()
  }
  const deleteOrg = async (id: string) => {
    const org = orgs.find((o) => o.id === id)
    const squadCount = squads.filter((s) => s.org_id === id).length
    const playerCount = players.filter((p) => p.org_id === id).length
    const parts = [`球隊「${org?.name}」`]
    if (squadCount > 0) parts.push(`${squadCount} 個小隊`)
    if (playerCount > 0) parts.push(`${playerCount} 位球員`)
    const msg = parts.length > 1
      ? `確定刪除 ${parts[0]}？\n會連帶刪除：${parts.slice(1).join('、')}\n(此操作無法復原)`
      : `確定刪除 ${parts[0]}？`
    if (!confirm(msg)) return
    await supabase.from('sb_organizations').delete().eq('id', id)
    if (selectedOrgId === id) { setSelectedOrgId(null); setSelectedSquadId(null); setSelectedPlayerId(null) }
    toast('已刪除'); await reload()
  }
  const saveSquad = async () => {
    if (!editingSquad?.name.trim() || !editingSquad?.org_id) return
    if (editingSquad.id) await supabase.from('sb_squads').update({ name: editingSquad.name, age_group: editingSquad.age_group }).eq('id', editingSquad.id)
    else await supabase.from('sb_squads').insert({ org_id: editingSquad.org_id, name: editingSquad.name, age_group: editingSquad.age_group })
    setEditingSquad(null); toast('已儲存'); await reload()
  }
  const deleteSquad = async (id: string) => {
    const squad = squads.find((s) => s.id === id)
    const memberCount = squadPlayerLinks.filter((sp) => sp.squad_id === id).length
    const parts = [`小隊「${squad?.name}」`]
    if (memberCount > 0) parts.push(`${memberCount} 位球員的小隊歸屬紀錄`)
    const msg = parts.length > 1
      ? `確定刪除 ${parts[0]}？\n會連帶刪除：${parts.slice(1).join('、')}\n(球員本身不會被刪除)`
      : `確定刪除 ${parts[0]}？`
    if (!confirm(msg)) return
    await supabase.from('sb_squads').delete().eq('id', id)
    if (selectedSquadId === id) setSelectedSquadId(null)
    toast('已刪除'); await reload()
  }
  const savePlayer = async () => {
    if (!editingPlayer?.name.trim()) return
    const payload = { name: editingPlayer.name, number: editingPlayer.number, birthday: editingPlayer.birthday || null, org_id: editingPlayer.org_id || null }
    if (editingPlayer.id) await supabase.from('sb_players').update(payload).eq('id', editingPlayer.id)
    else await supabase.from('sb_players').insert(payload)
    setEditingPlayer(null); toast('已儲存'); await reload()
  }
  const deletePlayer = async (id: string) => {
    const player = players.find((p) => p.id === id)
    if (!confirm(`確定刪除球員「${player?.name}」？\n所有比賽紀錄與名冊紀錄都會連帶刪除\n(此操作無法復原)`)) return
    await supabase.from('sb_players').delete().eq('id', id)
    if (selectedPlayerId === id) setSelectedPlayerId(null)
    toast('已刪除'); await reload()
  }
  const addPlayerToSquad = async (playerId: string, squadId: string) => {
    const player = players.find((p) => p.id === playerId)
    await supabase.from('sb_squad_players').insert({ squad_id: squadId, player_id: playerId, jersey_number: player?.number ?? '' })
    toast('已加入小隊'); await reload()
  }
  const removePlayerFromSquad = async (playerId: string, squadId: string) => {
    await supabase.from('sb_squad_players').delete().eq('squad_id', squadId).eq('player_id', playerId)
    toast('已移除'); await reload()
  }

  const orgSquads = squads.filter((s) => s.org_id === selectedOrgId)
  const orgPlayers = selectedOrgId ? players.filter((p) => p.org_id === selectedOrgId) : []
  const selectedPlayer = selectedPlayerId ? players.find((p) => p.id === selectedPlayerId) : null
  const playerSquadIds = selectedPlayerId ? new Set(squadPlayerLinks.filter((sp) => sp.player_id === selectedPlayerId).map((sp) => sp.squad_id)) : new Set<string>()
  const playerInSquads = squads.filter((s) => playerSquadIds.has(s.id))
  const playerAvailableSquads = selectedOrgId ? squads.filter((s) => s.org_id === selectedOrgId && !playerSquadIds.has(s.id)) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-bn-ink">組織與球員</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('squads')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${mode === 'squads' ? 'bg-bn-ink text-white' : 'bg-white text-bn-secondary border border-bn-border'}`}
          >隊伍／小隊</button>
          <button
            onClick={() => setMode('players')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-colors ${mode === 'players' ? 'bg-bn-ink text-white' : 'bg-white text-bn-secondary border border-bn-border'}`}
          >球員</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Col 1: Orgs */}
        <OrgsColumn
          orgs={orgs}
          players={players}
          selectedOrgId={selectedOrgId}
          editingOrg={editingOrg}
          onSelect={(id) => { setSelectedOrgId(id); setSelectedSquadId(null); setSelectedPlayerId(null) }}
          onEdit={setEditingOrg}
          onDelete={deleteOrg}
          onSave={saveOrg}
        />

        {/* Col 2: depends on mode */}
        {mode === 'squads' ? (
          <SquadsColumn
            selectedOrgId={selectedOrgId}
            orgSquads={orgSquads}
            selectedSquadId={selectedSquadId}
            editingSquad={editingSquad}
            onSelect={setSelectedSquadId}
            onEdit={setEditingSquad}
            onDelete={deleteSquad}
            onSave={saveSquad}
          />
        ) : (
          <PlayersColumn
            selectedOrgId={selectedOrgId}
            orgPlayers={orgPlayers}
            squadPlayerLinks={squadPlayerLinks}
            squads={squads}
            selectedPlayerId={selectedPlayerId}
            onSelect={setSelectedPlayerId}
            onEdit={setEditingPlayer}
            onDelete={deletePlayer}
            onNew={() => setEditingPlayer({ id: null, name: '', number: '', birthday: '', org_id: selectedOrgId ?? '' })}
          />
        )}

        {/* Col 3: depends on mode + selection */}
        {mode === 'squads' ? (
          <SquadMembersColumn
            selectedSquadId={selectedSquadId}
            squads={squads}
            squadPlayerLinks={squadPlayerLinks}
            players={players}
          />
        ) : (
          <PlayerSquadsColumn
            selectedPlayer={selectedPlayer}
            playerInSquads={playerInSquads}
            playerAvailableSquads={playerAvailableSquads}
            onAdd={(squadId) => addPlayerToSquad(selectedPlayerId!, squadId)}
            onRemove={(squadId) => removePlayerFromSquad(selectedPlayerId!, squadId)}
          />
        )}
      </div>

      {/* Player edit modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingPlayer(null)}>
          <div className="bg-white rounded-[12px] p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-bn-ink font-bold text-sm mb-4">{editingPlayer.id ? '編輯球員' : '新增球員'}</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-bn-secondary text-xs font-semibold mb-2">姓名 *</label>
                <input type="text" placeholder="球員姓名" value={editingPlayer.name} onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })} className={`${INPUT_CLASS} w-full`} autoFocus />
              </div>
              <div>
                <label className="block text-bn-secondary text-xs font-semibold mb-2">背號</label>
                <input type="text" placeholder="#" value={editingPlayer.number} onChange={(e) => setEditingPlayer({ ...editingPlayer, number: e.target.value })} className={`${INPUT_CLASS} w-full`} />
              </div>
              <div>
                <label className="block text-bn-secondary text-xs font-semibold mb-2">生日</label>
                <input type="date" value={editingPlayer.birthday} onChange={(e) => setEditingPlayer({ ...editingPlayer, birthday: e.target.value })} className={`${INPUT_CLASS} w-full`} />
              </div>
              <div>
                <label className="block text-bn-secondary text-xs font-semibold mb-2">所屬球隊 *</label>
                <select value={editingPlayer.org_id} onChange={(e) => setEditingPlayer({ ...editingPlayer, org_id: e.target.value })} className={`${INPUT_CLASS} w-full`}>
                  <option value="">-- 選擇球隊 --</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={savePlayer} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
              <button onClick={() => setEditingPlayer(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function OrgsColumn({ orgs, players, selectedOrgId, editingOrg, onSelect, onEdit, onDelete, onSave }: {
  orgs: Organization[]; players: DbPlayer[]; selectedOrgId: string | null
  editingOrg: EditingOrg | null
  onSelect: (id: string | null) => void
  onEdit: (e: EditingOrg | null) => void
  onDelete: (id: string) => void
  onSave: () => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border flex items-center justify-between bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">隊伍 ({orgs.length})</h2>
        <button onClick={() => onEdit({ id: null, name: '', short_name: '', logo_url: '' })} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>
      </div>
      {editingOrg && (
        <div className="p-4 border-b border-bn-border bg-bn-snow/50 space-y-3">
          <input type="text" placeholder="隊伍名稱" value={editingOrg.name} onChange={(e) => onEdit({ ...editingOrg, name: e.target.value })} className={`${INPUT_CLASS} w-full`} autoFocus />
          <input type="text" placeholder="簡稱 (顯示在 logo 上,2-3 字)" value={editingOrg.short_name} onChange={(e) => onEdit({ ...editingOrg, short_name: e.target.value })} className={`${INPUT_CLASS} w-full`} />
          <LogoUpload
            value={editingOrg.logo_url}
            shortName={editingOrg.short_name || editingOrg.name}
            onChange={(url) => onEdit({ ...editingOrg, logo_url: url })}
          />
          <div className="flex gap-2">
            <button onClick={onSave} className="px-4 py-2 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
            <button onClick={() => onEdit(null)} className="px-4 py-2 rounded-[6px] text-xs font-semibold text-bn-slate hover:text-bn-ink transition-colors">取消</button>
          </div>
        </div>
      )}
      <div className="divide-y divide-bn-border/50">
        {orgs.map((org) => {
          const playerCount = players.filter((p) => p.org_id === org.id).length
          const isActive = selectedOrgId === org.id
          return (
            <div key={org.id} onClick={() => onSelect(isActive ? null : org.id)}
              className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
              <div className="flex items-center gap-3">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.short_name || org.name} className="w-10 h-10 rounded-[10px] object-cover border border-bn-border flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-[10px] bg-bn-snow border border-bn-border grid place-items-center text-bn-slate text-[10px] flex-shrink-0">無</div>
                )}
                <div>
                  <p className={`font-semibold text-sm ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{org.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {org.short_name && <span className="text-bn-slate text-xs">{org.short_name}</span>}
                    <span className="text-bn-yellow text-xs font-semibold">{playerCount} 人</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEdit({ id: org.id, name: org.name, short_name: org.short_name, logo_url: org.logo_url }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(org.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
              </div>
            </div>
          )
        })}
        {orgs.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">點擊上方新增隊伍</p>}
      </div>
    </div>
  )
}

function SquadsColumn({ selectedOrgId, orgSquads, selectedSquadId, editingSquad, onSelect, onEdit, onDelete, onSave }: {
  selectedOrgId: string | null
  orgSquads: Squad[]
  selectedSquadId: string | null
  editingSquad: EditingSquad | null
  onSelect: (id: string | null) => void
  onEdit: (e: EditingSquad | null) => void
  onDelete: (id: string) => void
  onSave: () => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border flex items-center justify-between bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">小隊</h2>
        {selectedOrgId && (
          <button onClick={() => onEdit({ id: null, org_id: selectedOrgId, name: '', age_group: '' })} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>
        )}
      </div>
      {editingSquad && (
        <div className="p-4 border-b border-bn-border bg-bn-snow/50 space-y-2">
          <input type="text" placeholder="小隊名稱" value={editingSquad.name} onChange={(e) => onEdit({ ...editingSquad, name: e.target.value })} className={`${INPUT_CLASS} w-full`} autoFocus />
          <input type="text" placeholder="分組 (U12)" value={editingSquad.age_group} onChange={(e) => onEdit({ ...editingSquad, age_group: e.target.value })} className={`${INPUT_CLASS} w-full`} />
          <div className="flex gap-2">
            <button onClick={onSave} className="px-4 py-2 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
            <button onClick={() => onEdit(null)} className="px-4 py-2 rounded-[6px] text-xs font-semibold text-bn-slate hover:text-bn-ink transition-colors">取消</button>
          </div>
        </div>
      )}
      {!selectedOrgId ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇左側隊伍</p>
      ) : (
        <div className="divide-y divide-bn-border/50">
          {orgSquads.map((s) => {
            const isActive = selectedSquadId === s.id
            return (
              <div key={s.id} onClick={() => onSelect(isActive ? null : s.id)}
                className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                <div>
                  <p className={`font-semibold text-sm ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{s.name}</p>
                  <p className="text-bn-slate text-xs mt-0.5">{s.age_group}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onEdit({ id: s.id, org_id: s.org_id, name: s.name, age_group: s.age_group }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(s.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                </div>
              </div>
            )
          })}
          {orgSquads.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">點擊上方新增小隊</p>}
        </div>
      )}
    </div>
  )
}

function SquadMembersColumn({ selectedSquadId, squads, squadPlayerLinks, players }: {
  selectedSquadId: string | null
  squads: Squad[]
  squadPlayerLinks: { squad_id: string; player_id: string }[]
  players: DbPlayer[]
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">
          {selectedSquadId ? `${squads.find((s) => s.id === selectedSquadId)?.name} 球員` : '小隊球員'}
        </h2>
      </div>
      {!selectedSquadId ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇左側小隊</p>
      ) : (() => {
        const memberIds = squadPlayerLinks.filter((sp) => sp.squad_id === selectedSquadId).map((sp) => sp.player_id)
        const members = players.filter((p) => memberIds.includes(p.id))
        return (
          <div>
            <div className="divide-y divide-bn-border/50">
              {members.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="font-mono font-bold text-bn-yellow text-xs w-8 text-center">#{p.number}</span>
                  <span className="text-bn-ink text-sm font-medium">{p.name}</span>
                </div>
              ))}
              {members.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚無球員</p>}
            </div>
            <div className="border-t border-bn-border px-5 py-3">
              <p className="text-bn-muted text-xs">球員分配請切換到「球員」模式操作</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function PlayersColumn({ selectedOrgId, orgPlayers, squadPlayerLinks, squads, selectedPlayerId, onSelect, onEdit, onDelete, onNew }: {
  selectedOrgId: string | null
  orgPlayers: DbPlayer[]
  squadPlayerLinks: { squad_id: string; player_id: string }[]
  squads: Squad[]
  selectedPlayerId: string | null
  onSelect: (id: string | null) => void
  onEdit: (e: EditingPlayer) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border flex items-center justify-between bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">
          球員{selectedOrgId && <span className="text-bn-slate font-normal ml-1">({orgPlayers.length})</span>}
        </h2>
        {selectedOrgId && <button onClick={onNew} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>}
      </div>
      {!selectedOrgId ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇球隊</p>
      ) : (
        <div className="divide-y divide-bn-border/50 max-h-[500px] overflow-y-auto">
          {orgPlayers.map((p) => {
            const memberSquadNames = squadPlayerLinks
              .filter((sp) => sp.player_id === p.id)
              .map((sp) => squads.find((s) => s.id === sp.squad_id)?.name)
              .filter(Boolean)
            const isActive = selectedPlayerId === p.id
            return (
              <div key={p.id} onClick={() => onSelect(isActive ? null : p.id)}
                className={`px-5 py-3.5 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-bn-yellow text-xs">#{p.number}</span>
                    <span className={`font-semibold text-sm ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.birthday && <span className="text-bn-slate text-xs">{p.birthday}</span>}
                    {memberSquadNames.length > 0 && <span className="text-bn-muted text-xs">{memberSquadNames.join(', ')}</span>}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onEdit({ id: p.id, name: p.name, number: p.number, birthday: p.birthday ?? '', org_id: p.org_id ?? '' }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(p.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                </div>
              </div>
            )
          })}
          {orgPlayers.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">此球隊尚無球員</p>}
        </div>
      )}
    </div>
  )
}

function PlayerSquadsColumn({ selectedPlayer, playerInSquads, playerAvailableSquads, onAdd, onRemove }: {
  selectedPlayer: DbPlayer | null | undefined
  playerInSquads: Squad[]
  playerAvailableSquads: Squad[]
  onAdd: (squadId: string) => void
  onRemove: (squadId: string) => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">
          {selectedPlayer ? `${selectedPlayer.name} — 所屬小隊` : '所屬小隊'}
        </h2>
      </div>
      {!selectedPlayer ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇球員</p>
      ) : (
        <div>
          <div className="divide-y divide-bn-border/50">
            {playerInSquads.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between group hover:bg-bn-snow transition-colors">
                <span className="text-bn-ink text-sm font-semibold">{s.name}</span>
                <button onClick={() => onRemove(s.id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">移除</button>
              </div>
            ))}
            {playerInSquads.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚未加入任何小隊</p>}
          </div>
          {playerAvailableSquads.length > 0 && (
            <div className="border-t border-bn-border p-4">
              <p className="text-bn-secondary text-xs font-semibold mb-2">加入小隊</p>
              <div className="flex gap-2">
                <select id="add-player-squad" className={`${INPUT_CLASS} flex-1`} defaultValue="">
                  <option value="" disabled>-- 選擇小隊 --</option>
                  {playerAvailableSquads.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.age_group})</option>)}
                </select>
                <button onClick={() => {
                  const el = document.getElementById('add-player-squad') as HTMLSelectElement
                  if (el?.value) { onAdd(el.value); el.value = '' }
                }} className="px-4 py-2.5 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">加入</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
