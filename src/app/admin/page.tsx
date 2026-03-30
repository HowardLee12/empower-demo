'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { Coach, Event, Article, Course, Banner } from '@/lib/types'

type Tab = 'banners' | 'courses' | 'events' | 'articles' | 'coaches'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('banners')
  const [toast, setToast] = useState('')

  const store = useStore()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">管理後台</h1>
          <p className="text-white/50 text-sm text-center mb-6">EMPOWER Admin</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (password === 'empower2026') {
                setIsLoggedIn(true)
              } else {
                alert('密碼錯誤')
              }
            }}
          >
            <input
              type="password"
              placeholder="請輸入管理密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 mb-4"
            />
            <button
              type="submit"
              className="w-full bg-gold text-navy py-3 rounded-lg font-bold hover:bg-gold-dark transition-colors"
            >
              登入
            </button>
          </form>
          <p className="text-white/30 text-xs text-center mt-4">
            Demo 密碼：empower2026
          </p>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'banners', label: 'Banner', count: store.banners.length },
    { key: 'courses', label: '課程管理', count: store.courses.length },
    { key: 'events', label: '營隊活動', count: store.events.length },
    { key: 'articles', label: '文章管理', count: store.articles.length },
    { key: 'coaches', label: '教練管理', count: store.coaches.length },
  ]

  return (
    <div className="min-h-screen bg-[#0d1b2a]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-pulse">
          {toast}
        </div>
      )}

      {/* Admin Header */}
      <header className="bg-navy border-b border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-gold font-bold text-lg">EMPOWER 管理後台</h1>
            <span className="text-white/30 text-sm hidden sm:inline">|</span>
            <span className="text-white/30 text-sm hidden sm:inline">修改內容後前台即時更新</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-white/60 hover:text-gold text-sm transition-colors"
            >
              查看前台 ↗
            </Link>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-gold text-navy'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'banners' && <BannersAdmin banners={store.banners} setBanners={store.setBanners} showToast={showToast} />}
        {activeTab === 'courses' && <CoursesAdmin courses={store.courses} setCourses={store.setCourses} showToast={showToast} />}
        {activeTab === 'events' && <EventsAdmin events={store.events} setEvents={store.setEvents} showToast={showToast} />}
        {activeTab === 'articles' && <ArticlesAdmin articles={store.articles} setArticles={store.setArticles} showToast={showToast} />}
        {activeTab === 'coaches' && <CoachesAdmin coaches={store.coaches} setCoaches={store.setCoaches} showToast={showToast} />}
      </div>
    </div>
  )
}

/* ──────────────── Banners ──────────────── */

function BannersAdmin({
  banners,
  setBanners,
  showToast,
}: {
  banners: Banner[]
  setBanners: (b: Banner[]) => void
  showToast: (m: string) => void
}) {
  function updateBanner(id: string, field: keyof Banner, value: string | boolean | number) {
    setBanners(banners.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
    showToast('Banner 已更新！')
  }

  function addBanner() {
    const newBanner: Banner = {
      id: Date.now().toString(),
      title: '新 Banner',
      subtitle: '副標題',
      image_url: '',
      link_url: '#',
      is_active: true,
      sort_order: banners.length + 1,
    }
    setBanners([...banners, newBanner])
    showToast('已新增 Banner')
  }

  function deleteBanner(id: string) {
    setBanners(banners.filter((b) => b.id !== id))
    showToast('已刪除 Banner')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">首頁 Banner 管理</h2>
        <button onClick={addBanner} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">
          + 新增 Banner
        </button>
      </div>
      <div className="space-y-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1">標題</label>
                <input
                  value={banner.title}
                  onChange={(e) => updateBanner(banner.id, 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">副標題</label>
                <input
                  value={banner.subtitle}
                  onChange={(e) => updateBanner(banner.id, 'subtitle', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">連結網址</label>
                <input
                  value={banner.link_url}
                  onChange={(e) => updateBanner(banner.id, 'link_url', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={banner.is_active}
                    onChange={(e) => updateBanner(banner.id, 'is_active', e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-white/60 text-sm">啟用</span>
                </label>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Courses ──────────────── */

function CoursesAdmin({
  courses,
  setCourses,
  showToast,
}: {
  courses: Course[]
  setCourses: (c: Course[]) => void
  showToast: (m: string) => void
}) {
  function updateCourse(id: string, field: keyof Course, value: string | boolean | number) {
    setCourses(courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
    showToast('課程已更新！')
  }

  function addCourse() {
    const newCourse: Course = {
      id: Date.now().toString(),
      title: '新課程',
      description: '課程說明',
      schedule: '每週六 10:00-12:00',
      location: '場地',
      age_group: '年齡層',
      image_url: '',
      registration_url: 'https://www.empower.com.tw/',
      is_active: true,
      sort_order: courses.length + 1,
    }
    setCourses([...courses, newCourse])
    showToast('已新增課程')
  }

  function deleteCourse(id: string) {
    setCourses(courses.filter((c) => c.id !== id))
    showToast('已刪除課程')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">課程管理</h2>
        <button onClick={addCourse} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">
          + 新增課程
        </button>
      </div>
      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1">課程名稱</label>
                <input
                  value={course.title}
                  onChange={(e) => updateCourse(course.id, 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">時間</label>
                <input
                  value={course.schedule}
                  onChange={(e) => updateCourse(course.id, 'schedule', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">地點</label>
                <input
                  value={course.location}
                  onChange={(e) => updateCourse(course.id, 'location', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">年齡層</label>
                <input
                  value={course.age_group}
                  onChange={(e) => updateCourse(course.id, 'age_group', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/50 text-xs mb-1">說明</label>
                <textarea
                  value={course.description}
                  onChange={(e) => updateCourse(course.id, 'description', e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">報名連結（付費頁面）</label>
                <input
                  value={course.registration_url}
                  onChange={(e) => updateCourse(course.id, 'registration_url', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={course.is_active}
                    onChange={(e) => updateCourse(course.id, 'is_active', e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-white/60 text-sm">上架中</span>
                </label>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Events ──────────────── */

function EventsAdmin({
  events,
  setEvents,
  showToast,
}: {
  events: Event[]
  setEvents: (e: Event[]) => void
  showToast: (m: string) => void
}) {
  function updateEvent(id: string, field: keyof Event, value: string | boolean | number) {
    setEvents(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
    showToast('活動已更新！')
  }

  function addEvent() {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: '新活動',
      description: '活動說明',
      image_url: '',
      date: '2026-08-01',
      location: '場地',
      registration_url: 'https://www.empower.com.tw/',
      is_published: true,
      sort_order: events.length + 1,
    }
    setEvents([...events, newEvent])
    showToast('已新增活動')
  }

  function deleteEvent(id: string) {
    setEvents(events.filter((e) => e.id !== id))
    showToast('已刪除活動')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">營隊活動管理</h2>
        <button onClick={addEvent} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">
          + 新增活動
        </button>
      </div>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1">活動名稱</label>
                <input
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">日期</label>
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">地點</label>
                <input
                  value={event.location}
                  onChange={(e) => updateEvent(event.id, 'location', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">報名連結</label>
                <input
                  value={event.registration_url}
                  onChange={(e) => updateEvent(event.id, 'registration_url', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/50 text-xs mb-1">說明</label>
                <textarea
                  value={event.description}
                  onChange={(e) => updateEvent(event.id, 'description', e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={event.is_published}
                    onChange={(e) => updateEvent(event.id, 'is_published', e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-white/60 text-sm">已發佈</span>
                </label>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Articles ──────────────── */

function ArticlesAdmin({
  articles,
  setArticles,
  showToast,
}: {
  articles: Article[]
  setArticles: (a: Article[]) => void
  showToast: (m: string) => void
}) {
  function updateArticle(id: string, field: keyof Article, value: string | boolean) {
    setArticles(articles.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
    showToast('文章已更新！')
  }

  function addArticle() {
    const newArticle: Article = {
      id: Date.now().toString(),
      title: '新文章',
      excerpt: '文章摘要',
      content: '文章內容...',
      image_url: '',
      published_at: new Date().toISOString().split('T')[0],
      is_published: true,
    }
    setArticles([...articles, newArticle])
    showToast('已新增文章')
  }

  function deleteArticle(id: string) {
    setArticles(articles.filter((a) => a.id !== id))
    showToast('已刪除文章')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">文章管理</h2>
        <button onClick={addArticle} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">
          + 新增文章
        </button>
      </div>
      <div className="space-y-4">
        {articles.map((article) => (
          <div key={article.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1">標題</label>
                <input
                  value={article.title}
                  onChange={(e) => updateArticle(article.id, 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">發佈日期</label>
                <input
                  type="date"
                  value={article.published_at}
                  onChange={(e) => updateArticle(article.id, 'published_at', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/50 text-xs mb-1">摘要</label>
                <textarea
                  value={article.excerpt}
                  onChange={(e) => updateArticle(article.id, 'excerpt', e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/50 text-xs mb-1">內容</label>
                <textarea
                  value={article.content}
                  onChange={(e) => updateArticle(article.id, 'content', e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={article.is_published}
                    onChange={(e) => updateArticle(article.id, 'is_published', e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-white/60 text-sm">已發佈</span>
                </label>
                <button
                  onClick={() => deleteArticle(article.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Coaches ──────────────── */

function CoachesAdmin({
  coaches,
  setCoaches,
  showToast,
}: {
  coaches: Coach[]
  setCoaches: (c: Coach[]) => void
  showToast: (m: string) => void
}) {
  function updateCoach(id: string, field: keyof Coach, value: string | boolean | number) {
    setCoaches(coaches.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
    showToast('教練資料已更新！')
  }

  function addCoach() {
    const newCoach: Coach = {
      id: Date.now().toString(),
      name: '新教練',
      title: '職稱',
      bio: '教練簡介',
      image_url: '',
      is_active: true,
      sort_order: coaches.length + 1,
    }
    setCoaches([...coaches, newCoach])
    showToast('已新增教練')
  }

  function deleteCoach(id: string) {
    setCoaches(coaches.filter((c) => c.id !== id))
    showToast('已刪除教練')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">教練管理</h2>
        <button onClick={addCoach} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">
          + 新增教練
        </button>
      </div>
      <div className="space-y-4">
        {coaches.map((coach) => (
          <div key={coach.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1">姓名</label>
                <input
                  value={coach.name}
                  onChange={(e) => updateCoach(coach.id, 'name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">職稱</label>
                <input
                  value={coach.title}
                  onChange={(e) => updateCoach(coach.id, 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/50 text-xs mb-1">簡介</label>
                <textarea
                  value={coach.bio}
                  onChange={(e) => updateCoach(coach.id, 'bio', e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coach.is_active}
                    onChange={(e) => updateCoach(coach.id, 'is_active', e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-white/60 text-sm">在職中</span>
                </label>
                <button
                  onClick={() => deleteCoach(coach.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
