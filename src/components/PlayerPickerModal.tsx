'use client'

import { useState, useMemo } from 'react'

interface Player {
  id: string
  number: string
  name: string
}

interface PlayerPickerModalProps {
  players: Player[]
  title: string
  onConfirm: (selectedIds: string[]) => void
  onClose: () => void
}

export function PlayerPickerModal({ players, title, onConfirm, onClose }: PlayerPickerModalProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return players
    const q = search.trim().toLowerCase()
    return players.filter((p) =>
      p.name.toLowerCase().includes(q) || p.number.includes(q)
    )
  }, [players, search])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(filtered.map((p) => p.id)))
  }

  const clearAll = () => {
    setSelected(new Set())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-[12px] border border-bn-border shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-bn-border flex items-center justify-between">
          <h3 className="text-bn-ink font-bold text-sm">{title}</h3>
          <button onClick={onClose} className="text-bn-slate hover:text-bn-ink text-lg transition-colors">&times;</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-bn-border">
          <input
            type="text"
            placeholder="搜尋球員姓名或背號..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bn-snow border border-bn-border rounded-[8px] px-4 py-2.5 text-bn-ink text-sm placeholder:text-bn-slate focus:outline-none focus:border-bn-yellow transition-colors"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-bn-slate text-xs">{filtered.length} 位球員 / 已選 {selected.size} 位</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-bn-yellow text-xs font-semibold hover:text-bn-active transition-colors">全選</button>
              <button onClick={clearAll} className="text-bn-slate text-xs font-semibold hover:text-bn-ink transition-colors">清除</button>
            </div>
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto divide-y divide-bn-border/50">
          {filtered.map((p) => {
            const isChecked = selected.has(p.id)
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`px-5 py-3 flex items-center gap-3 cursor-pointer transition-colors ${isChecked ? 'bg-bn-yellow/10' : 'hover:bg-bn-snow'}`}
              >
                <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-bn-yellow border-bn-yellow' : 'border-bn-border'}`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="font-mono font-bold text-bn-yellow text-xs w-8 text-center">#{p.number}</span>
                <span className={`text-sm font-medium ${isChecked ? 'text-bn-ink' : 'text-bn-secondary'}`}>{p.name}</span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-bn-slate text-xs text-center">
              {search ? '找不到符合的球員' : '沒有可選的球員'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-bn-border flex items-center justify-between">
          <span className="text-bn-slate text-xs">已選擇 {selected.size} 位球員</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-snow text-bn-secondary border border-bn-border transition-colors hover:bg-bn-border/40">取消</button>
            <button
              onClick={() => onConfirm([...selected])}
              disabled={selected.size === 0}
              className="px-5 py-2.5 rounded-[6px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              加入 ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
