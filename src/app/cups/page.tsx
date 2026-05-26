'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'

interface Cup {
  id: string
  name: string
  region: string
  type: string
}

export default function CupsPage() {
  const [cups, setCups] = useState<readonly Cup[]>([])
  const [gameCounts, setGameCounts] = useState<ReadonlyMap<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [cRes, sRes] = await Promise.all([
        supabase.from('sb_cups').select('id,name,region,type').order('name'),
        supabase.from('sb_seasons').select('id,cup_id'),
      ])

      if (cRes.data) setCups(cRes.data)

      if (sRes.data) {
        const seasonCupMap = new Map<string, string>()
        for (const s of sRes.data) seasonCupMap.set(s.id, s.cup_id)
        const gRes = await supabase.from('sb_games').select('season_id')
        if (gRes.data) {
          const counts = new Map<string, number>()
          for (const g of gRes.data) {
            const cupId = g.season_id ? seasonCupMap.get(g.season_id) : null
            if (cupId) counts.set(cupId, (counts.get(cupId) ?? 0) + 1)
          }
          setGameCounts(counts)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-bn-snow">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-bn-yellow/30 border-t-bn-yellow rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      <div className="pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10">
          <h1 className="text-2xl font-bold text-bn-ink mb-1">盃賽</h1>
          <p className="text-bn-slate text-sm mb-8">所有盃賽一覽</p>

          {cups.length === 0 ? (
            <div className="rounded-[16px] bg-white border border-bn-border p-12 text-center">
              <p className="text-bn-slate text-sm">目前沒有盃賽</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cups.map((cup) => {
                const count = gameCounts.get(cup.id) ?? 0
                return (
                  <Link
                    key={cup.id}
                    href={`/leagues/${cup.id}`}
                    className="group rounded-[16px] bg-white border border-bn-border p-6 hover:border-bn-yellow/40 hover:-translate-y-[1px] transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-2 h-2 rounded-full bg-bn-yellow" />
                      <span className="text-[11px] font-semibold text-bn-slate tracking-wider uppercase">
                        {cup.type || '盃賽'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-bn-ink group-hover:text-bn-yellow transition-colors">
                      {cup.name}
                    </h2>
                    {cup.region && (
                      <p className="text-sm text-bn-slate mt-1">{cup.region}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-bn-border/50">
                      <span className="text-xs text-bn-slate">
                        {count} 場賽事
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
