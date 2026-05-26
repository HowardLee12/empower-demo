'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlayerPickerModal } from '@/components/PlayerPickerModal'
import type { ManagementData, Cup, Season } from './types'
import { INPUT_CLASS } from './types'

type Props = {
  data: ManagementData
  reload: () => Promise<void>
  toast: (msg: string) => void
}

interface EditingCup { id: string | null; name: string; region: string; type: string }
interface EditingSeason { id: string | null; cup_id: string; name: string; year: string }

export function CupsSeasonsTab({ data, reload, toast }: Props) {
  const { cups, seasons, seasonSquadLinks, seasonRosters, squads, players, orgs, squadPlayerLinks } = data

  const [selectedCupId, setSelectedCupId] = useState<string | null>(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [editingCup, setEditingCup] = useState<EditingCup | null>(null)
  const [editingSeason, setEditingSeason] = useState<EditingSeason | null>(null)
  const [showRosterPicker, setShowRosterPicker] = useState(false)

  // --- Cup CRUD ---
  const saveCup = async () => {
    if (!editingCup?.name.trim()) return
    const payload = { name: editingCup.name, region: editingCup.region, type: editingCup.type }
    if (editingCup.id) await supabase.from('sb_cups').update(payload).eq('id', editingCup.id)
    else await supabase.from('sb_cups').insert(payload)
    setEditingCup(null); toast('已儲存'); await reload()
  }
  const deleteCup = async (id: string) => {
    await supabase.from('sb_cups').delete().eq('id', id)
    if (selectedCupId === id) { setSelectedCupId(null); setSelectedSeasonId(null); setSelectedSquadId(null) }
    toast('已刪除'); await reload()
  }

  // --- Season CRUD ---
  const saveSeason = async () => {
    if (!editingSeason?.name.trim() || !editingSeason?.cup_id) return
    const year = editingSeason.year ? parseInt(editingSeason.year) : null
    const payload = { cup_id: editingSeason.cup_id, name: editingSeason.name, year }
    if (editingSeason.id) await supabase.from('sb_seasons').update(payload).eq('id', editingSeason.id)
    else await supabase.from('sb_seasons').insert(payload)
    setEditingSeason(null); toast('已儲存'); await reload()
  }
  const deleteSeason = async (id: string) => {
    await supabase.from('sb_seasons').delete().eq('id', id)
    if (selectedSeasonId === id) { setSelectedSeasonId(null); setSelectedSquadId(null) }
    toast('已刪除'); await reload()
  }
  const toggleHomepage = async (s: Season) => {
    await supabase.from('sb_seasons').update({ is_homepage: !s.is_homepage }).eq('id', s.id)
    await reload()
  }

  // --- Season Squad management ---
  const addSquadToSeason = async (seasonId: string, squadId: string) => {
    await supabase.from('sb_season_squads').insert({ season_id: seasonId, squad_id: squadId })
    toast('已加入'); await reload()
  }
  const removeSquadFromSeason = async (seasonId: string, squadId: string) => {
    await supabase.from('sb_season_squads').delete().eq('season_id', seasonId).eq('squad_id', squadId)
    toast('已移除'); await reload()
  }

  // --- Season Roster (per-season players) ---
  const addPlayerToRoster = async (seasonId: string, squadId: string, playerId: string, jerseyNumber: string) => {
    await supabase.from('sb_season_rosters').insert({ season_id: seasonId, squad_id: squadId, player_id: playerId, jersey_number: jerseyNumber })
    toast('已加入名單'); await reload()
  }
  const removePlayerFromRoster = async (seasonId: string, squadId: string, playerId: string) => {
    await supabase.from('sb_season_rosters').delete().eq('season_id', seasonId).eq('squad_id', squadId).eq('player_id', playerId)
    toast('已移除'); await reload()
  }

  const cupSeasons = selectedCupId ? seasons.filter((s) => s.cup_id === selectedCupId).sort((a, b) => (b.year ?? 0) - (a.year ?? 0)) : []
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId)
  const seasonSquadIds = new Set(seasonSquadLinks.filter((ss) => ss.season_id === selectedSeasonId).map((ss) => ss.squad_id))
  const seasonSquads = squads.filter((s) => seasonSquadIds.has(s.id))
  const availableSquads = squads.filter((s) => !seasonSquadIds.has(s.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-bn-ink">盃賽與名冊</h1>
        <button onClick={() => setEditingCup({ id: null, name: '', region: '', type: '' })} className="px-5 py-2.5 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">+ 新增盃賽</button>
      </div>

      {/* Cup edit modal */}
      {editingCup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingCup(null)}>
          <div className="bg-white rounded-[12px] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-bn-ink font-bold text-sm mb-4">{editingCup.id ? '編輯盃賽' : '新增盃賽'}</h3>
            <div className="space-y-3 mb-4">
              <div><label className="block text-bn-secondary text-xs font-semibold mb-2">名稱 *</label><input type="text" placeholder="Finals" value={editingCup.name} onChange={(e) => setEditingCup({ ...editingCup, name: e.target.value })} className={`${INPUT_CLASS} w-full`} autoFocus /></div>
              <div><label className="block text-bn-secondary text-xs font-semibold mb-2">地區／組別</label><input type="text" placeholder="台北信義" value={editingCup.region} onChange={(e) => setEditingCup({ ...editingCup, region: e.target.value })} className={`${INPUT_CLASS} w-full`} /></div>
              <div><label className="block text-bn-secondary text-xs font-semibold mb-2">類型</label><input type="text" placeholder="Finals / Galaxy / League" value={editingCup.type} onChange={(e) => setEditingCup({ ...editingCup, type: e.target.value })} className={`${INPUT_CLASS} w-full`} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveCup} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
              <button onClick={() => setEditingCup(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Season edit modal */}
      {editingSeason && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingSeason(null)}>
          <div className="bg-white rounded-[12px] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-bn-ink font-bold text-sm mb-4">{editingSeason.id ? '編輯賽季' : '新增賽季'}</h3>
            <div className="space-y-3 mb-4">
              <div><label className="block text-bn-secondary text-xs font-semibold mb-2">名稱 *</label><input type="text" placeholder="2026 S1" value={editingSeason.name} onChange={(e) => setEditingSeason({ ...editingSeason, name: e.target.value })} className={`${INPUT_CLASS} w-full`} autoFocus /></div>
              <div><label className="block text-bn-secondary text-xs font-semibold mb-2">年份</label><input type="number" placeholder="2026" value={editingSeason.year} onChange={(e) => setEditingSeason({ ...editingSeason, year: e.target.value })} className={`${INPUT_CLASS} w-full`} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveSeason} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">儲存</button>
              <button onClick={() => setEditingSeason(null)} className="px-6 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors">取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_280px_1fr] gap-5">
        {/* Col 1: Cups */}
        <CupsColumn
          cups={cups}
          seasons={seasons}
          selectedCupId={selectedCupId}
          onSelect={(id) => { setSelectedCupId(id); setSelectedSeasonId(null); setSelectedSquadId(null) }}
          onEdit={setEditingCup}
          onDelete={deleteCup}
        />

        {/* Col 2: Seasons */}
        <SeasonsColumn
          selectedCupId={selectedCupId}
          cupSeasons={cupSeasons}
          selectedSeasonId={selectedSeasonId}
          onSelect={(id) => { setSelectedSeasonId(id); setSelectedSquadId(null) }}
          onAdd={() => setEditingSeason({ id: null, cup_id: selectedCupId!, name: '', year: String(new Date().getFullYear()) })}
          onEdit={(s) => setEditingSeason({ id: s.id, cup_id: s.cup_id, name: s.name, year: s.year?.toString() ?? '' })}
          onDelete={deleteSeason}
          onToggleHomepage={toggleHomepage}
        />

        {/* Col 3: Squads + Roster (nested) */}
        <div className="grid sm:grid-cols-2 gap-5">
          <SeasonSquadsColumn
            selectedSeason={selectedSeason}
            seasonSquads={seasonSquads}
            availableSquads={availableSquads}
            orgs={orgs}
            seasonRosters={seasonRosters}
            selectedSquadId={selectedSquadId}
            onSelect={setSelectedSquadId}
            onAdd={(squadId) => addSquadToSeason(selectedSeasonId!, squadId)}
            onRemove={(squadId) => removeSquadFromSeason(selectedSeasonId!, squadId)}
          />

          <SeasonRosterColumn
            selectedSeason={selectedSeason}
            selectedSquadId={selectedSquadId}
            squads={squads}
            players={players}
            squadPlayerLinks={squadPlayerLinks}
            seasonRosters={seasonRosters}
            onRemove={(playerId) => removePlayerFromRoster(selectedSeasonId!, selectedSquadId!, playerId)}
            onOpenPicker={() => setShowRosterPicker(true)}
            showPicker={showRosterPicker}
            onClosePicker={() => setShowRosterPicker(false)}
            onAddBatch={async (ids) => {
              for (const pid of ids) {
                const p = players.find((pl) => pl.id === pid)
                await addPlayerToRoster(selectedSeasonId!, selectedSquadId!, pid, p?.number ?? '')
              }
              setShowRosterPicker(false)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function CupsColumn({ cups, seasons, selectedCupId, onSelect, onEdit, onDelete }: {
  cups: Cup[]
  seasons: Season[]
  selectedCupId: string | null
  onSelect: (id: string | null) => void
  onEdit: (e: EditingCup) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">盃賽 ({cups.length})</h2>
      </div>
      <div className="divide-y divide-bn-border/50">
        {cups.map((c) => {
          const seasonCount = seasons.filter((s) => s.cup_id === c.id).length
          const isActive = selectedCupId === c.id
          return (
            <div key={c.id} onClick={() => onSelect(isActive ? null : c.id)}
              className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
              <div>
                <p className={`font-semibold text-sm ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{c.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {c.region && <span className="text-bn-slate text-xs">{c.region}</span>}
                  {c.type && <span className="text-bn-muted text-xs">{c.type}</span>}
                  <span className="text-bn-yellow text-xs font-semibold">{seasonCount} 賽季</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEdit({ id: c.id, name: c.name, region: c.region, type: c.type }) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(c.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
              </div>
            </div>
          )
        })}
        {cups.length === 0 && <p className="px-5 py-8 text-bn-slate text-xs text-center">尚未建立盃賽</p>}
      </div>
    </div>
  )
}

function SeasonsColumn({ selectedCupId, cupSeasons, selectedSeasonId, onSelect, onAdd, onEdit, onDelete, onToggleHomepage }: {
  selectedCupId: string | null
  cupSeasons: Season[]
  selectedSeasonId: string | null
  onSelect: (id: string | null) => void
  onAdd: () => void
  onEdit: (s: Season) => void
  onDelete: (id: string) => void
  onToggleHomepage: (s: Season) => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow flex items-center justify-between">
        <h2 className="text-bn-ink font-bold text-sm">賽季</h2>
        {selectedCupId && <button onClick={onAdd} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">+ 新增</button>}
      </div>
      {!selectedCupId ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇盃賽</p>
      ) : (
        <div className="divide-y divide-bn-border/50">
          {cupSeasons.map((s) => {
            const isActive = selectedSeasonId === s.id
            return (
              <div key={s.id} onClick={() => onSelect(isActive ? null : s.id)}
                className={`px-5 py-3 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{s.name}</span>
                  {s.is_homepage && <span className="text-[10px] font-bold text-bn-green bg-bn-green/10 px-1.5 py-0.5 rounded">首頁</span>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleHomepage(s) }}
                    className="text-bn-slate hover:text-bn-green text-xs font-semibold transition-colors"
                    title={s.is_homepage ? '取消首頁顯示' : '設為首頁顯示'}
                  >{s.is_homepage ? '取消首頁' : '設首頁'}</button>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(s) }} className="text-bn-slate hover:text-bn-yellow text-xs font-semibold transition-colors">編輯</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(s.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold transition-colors">刪除</button>
                </div>
              </div>
            )
          })}
          {cupSeasons.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚未建立賽季</p>}
        </div>
      )}
    </div>
  )
}

function SeasonSquadsColumn({ selectedSeason, seasonSquads, availableSquads, orgs, seasonRosters, selectedSquadId, onSelect, onAdd, onRemove }: {
  selectedSeason: Season | undefined
  seasonSquads: { id: string; name: string; org_id: string }[]
  availableSquads: { id: string; name: string; org_id: string }[]
  orgs: { id: string; name: string; short_name: string }[]
  seasonRosters: { season_id: string; squad_id: string }[]
  selectedSquadId: string | null
  onSelect: (id: string | null) => void
  onAdd: (squadId: string) => void
  onRemove: (squadId: string) => void
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow flex items-center justify-between">
        <h2 className="text-bn-ink font-bold text-sm">參賽隊伍</h2>
        {selectedSeason && <span className="text-bn-slate text-xs">{seasonSquads.length} 隊</span>}
      </div>
      {!selectedSeason ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇賽季</p>
      ) : (
        <>
          <div className="divide-y divide-bn-border/50">
            {seasonSquads.map((s) => {
              const org = orgs.find((o) => o.id === s.org_id)
              const rosterCount = seasonRosters.filter((r) => r.season_id === selectedSeason.id && r.squad_id === s.id).length
              const isActive = selectedSquadId === s.id
              return (
                <div key={s.id} onClick={() => onSelect(isActive ? null : s.id)}
                  className={`px-5 py-3 cursor-pointer flex items-center justify-between group transition-colors ${isActive ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}>
                  <div>
                    <span className={`text-sm font-semibold ${isActive ? 'text-bn-yellow' : 'text-bn-ink'}`}>{s.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-bn-slate text-xs">{org?.short_name}</span>
                      <span className="text-bn-muted text-xs">{rosterCount} 人</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onRemove(s.id) }} className="text-bn-slate hover:text-bn-red text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">移除</button>
                </div>
              )
            })}
            {seasonSquads.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚未加入隊伍</p>}
          </div>
          {availableSquads.length > 0 && (
            <div className="border-t border-bn-border p-4">
              <p className="text-bn-secondary text-xs font-semibold mb-2">新增隊伍</p>
              <div className="flex gap-2">
                <select id="add-squad-to-season" className={`${INPUT_CLASS} flex-1`} defaultValue="">
                  <option value="" disabled>-- 選擇 --</option>
                  {availableSquads.map((s) => {
                    const org = orgs.find((o) => o.id === s.org_id)
                    return <option key={s.id} value={s.id}>{org?.short_name ?? org?.name} - {s.name}</option>
                  })}
                </select>
                <button onClick={() => {
                  const el = document.getElementById('add-squad-to-season') as HTMLSelectElement
                  if (el?.value) { onAdd(el.value); el.value = '' }
                }} className="px-4 py-2.5 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">加入</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SeasonRosterColumn({ selectedSeason, selectedSquadId, squads, players, squadPlayerLinks, seasonRosters, onRemove, onOpenPicker, showPicker, onClosePicker, onAddBatch }: {
  selectedSeason: Season | undefined
  selectedSquadId: string | null
  squads: { id: string; name: string }[]
  players: { id: string; name: string; number: string; org_id: string | null }[]
  squadPlayerLinks: { squad_id: string; player_id: string }[]
  seasonRosters: { season_id: string; squad_id: string; player_id: string; jersey_number: string }[]
  onRemove: (playerId: string) => void
  onOpenPicker: () => void
  showPicker: boolean
  onClosePicker: () => void
  onAddBatch: (ids: string[]) => Promise<void>
}) {
  return (
    <div className="rounded-[12px] bg-white border border-bn-border overflow-hidden">
      <div className="px-5 py-3 border-b border-bn-border bg-bn-snow">
        <h2 className="text-bn-ink font-bold text-sm">
          {selectedSquadId ? `${squads.find((s) => s.id === selectedSquadId)?.name} 名單` : '參賽名單'}
        </h2>
      </div>
      {!selectedSeason || !selectedSquadId ? (
        <p className="px-5 py-8 text-bn-slate text-xs text-center">請先選擇賽季與隊伍</p>
      ) : (() => {
        const rosterEntries = seasonRosters.filter((r) => r.season_id === selectedSeason.id && r.squad_id === selectedSquadId)
        const rosterPlayerIds = new Set(rosterEntries.map((r) => r.player_id))
        const squadMemberIds = new Set(squadPlayerLinks.filter((sp) => sp.squad_id === selectedSquadId).map((sp) => sp.player_id))
        const squadAllPlayers = players.filter((p) => squadMemberIds.has(p.id))
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
                    <button onClick={() => onRemove(r.player_id)} className="text-bn-slate hover:text-bn-red text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">移除</button>
                  </div>
                )
              })}
              {rosterEntries.length === 0 && <p className="px-5 py-4 text-bn-slate text-xs text-center">尚未加入球員</p>}
            </div>
            <div className="border-t border-bn-border p-4">
              {availablePlayers.length > 0 ? (
                <button onClick={onOpenPicker} className="w-full py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors">
                  + 新增球員到名單 ({availablePlayers.length} 位可選)
                </button>
              ) : (
                <p className="text-bn-muted text-xs text-center">{squadAllPlayers.length === 0 ? '此小隊尚無球員，請先到「組織與球員」加入' : '所有球員都已在名單'}</p>
              )}
              {showPicker && (
                <PlayerPickerModal
                  players={availablePlayers}
                  title={`加入 ${squads.find((s) => s.id === selectedSquadId)?.name ?? ''} 參賽名單`}
                  onClose={onClosePicker}
                  onConfirm={onAddBatch}
                />
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
