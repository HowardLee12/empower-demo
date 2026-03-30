'use client'

import { useState, ReactNode } from 'react'
import { StoreContext } from '@/lib/store'
import { Banner, Coach, Event, Article, Course } from '@/lib/types'
import {
  demoBanners,
  demoCoaches,
  demoEvents,
  demoArticles,
  demoCourses,
} from '@/lib/demo-data'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>(demoBanners)
  const [coaches, setCoaches] = useState<Coach[]>(demoCoaches)
  const [events, setEvents] = useState<Event[]>(demoEvents)
  const [articles, setArticles] = useState<Article[]>(demoArticles)
  const [courses, setCourses] = useState<Course[]>(demoCourses)

  return (
    <StoreContext.Provider
      value={{
        banners,
        coaches,
        events,
        articles,
        courses,
        setBanners,
        setCoaches,
        setEvents,
        setArticles,
        setCourses,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}
