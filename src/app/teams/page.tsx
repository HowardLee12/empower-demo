'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { TeamEmblem } from '@/components/TeamEmblem'

interface Squad {
  id: string
  name: string
  age_group: string
  org_id: string
}

interface Organization {
  id: string
  name: string
  short_name: string
}

export default function TeamsPage() {
  const [squads, setSquads] = useState<readonly Squad[]>([])
  const [orgs, setOrgs] = useState<ReadonlyMap<string, Organization>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [sRes, oRes] = await Promise.all([
        supabase.from('sb_squads').select('id,name,age_group,org_id').order('name'),
        supabase.from('sb_organizations').select('id,name,short_name'),
      ])

      if (sRes.data) setSquads(sRes.data)

      if (oRes.data) {
        const map = new Map<string, Organization>()
        for (const o of oRes.data) {
          map.set(o.id, o)
        }
        setOrgs(map)
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

  const orgGroups = new Map<string, readonly Squad[]>()
  for (const squad of squads) {
    const existing = orgGroups.get(squad.org_id) ?? []
    orgGroups.set(squad.org_id, [...existing, squad])
  }

  return (
    <div className="min-h-screen bg-bn-snow">
      <Navbar />

      <div className="pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10">
          <h1 className="text-2xl font-bold text-bn-ink mb-1">隊伍</h1>
          <p className="text-bn-slate text-sm mb-8">所有參賽隊伍</p>

          {squads.length === 0 ? (
            <div className="rounded-[16px] bg-white border border-bn-border p-12 text-center">
              <p className="text-bn-slate text-sm">目前沒有隊伍</p>
            </div>
          ) : (
            <div className="space-y-8">
              {[...orgGroups.entries()].map(([orgId, orgSquads]) => {
                const org = orgs.get(orgId)
                return (
                  <section key={orgId}>
                    <div className="flex items-center gap-3 mb-4">
                      <TeamEmblem shortName={org?.short_name ?? '?'} size="md" />
                      <h2 className="text-lg font-bold text-bn-ink">
                        {org?.name ?? '未知組織'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {orgSquads.map((squad) => (
                        <Link
                          key={squad.id}
                          href={`/squads/${squad.id}`}
                          className="group rounded-[16px] bg-white border border-bn-border px-5 py-4 flex items-center gap-4 hover:border-bn-yellow/40 hover:-translate-y-[1px] transition-all"
                        >
                          <TeamEmblem shortName={org?.short_name ?? '?'} size="sm" />
                          <div>
                            <div className="font-semibold text-bn-ink group-hover:text-bn-yellow transition-colors">
                              {squad.name}
                            </div>
                            {squad.age_group && (
                              <div className="text-xs text-bn-slate mt-0.5">
                                {squad.age_group}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
