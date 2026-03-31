'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { StoreContext } from '@/lib/store'
import { Banner, Coach, Event, Article, Course } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const [b, co, e, a, cr] = await Promise.all([
      supabase.from('banners').select('*').order('sort_order'),
      supabase.from('coaches').select('*').order('sort_order'),
      supabase.from('events').select('*').order('sort_order'),
      supabase.from('articles').select('*').order('published_at', { ascending: false }),
      supabase.from('courses').select('*').order('sort_order'),
    ])
    if (b.data) setBanners(b.data)
    if (co.data) setCoaches(co.data)
    if (e.data) setEvents(e.data)
    if (a.data) setArticles(a.data)
    if (cr.data) setCourses(cr.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <StoreContext.Provider
      value={{
        banners, coaches, events, articles, courses,
        loading, reload,
        setBanners, setCoaches, setEvents, setArticles, setCourses,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}
