'use client'

import { createContext, useContext } from 'react'
import { Banner, Coach, Event, Article, Course } from './types'

export interface StoreState {
  banners: Banner[]
  coaches: Coach[]
  events: Event[]
  articles: Article[]
  courses: Course[]
  setBanners: (banners: Banner[]) => void
  setCoaches: (coaches: Coach[]) => void
  setEvents: (events: Event[]) => void
  setArticles: (articles: Article[]) => void
  setCourses: (courses: Course[]) => void
}

export const StoreContext = createContext<StoreState | null>(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
