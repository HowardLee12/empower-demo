'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
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
          <p className="text-white/30 text-xs text-center mt-4">Demo 密碼：empower2026</p>
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
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-pulse">
          {toast}
        </div>
      )}

      <header className="bg-navy border-b border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-gold font-bold text-lg">EMPOWER 管理後台</h1>
            <span className="text-white/30 text-sm hidden sm:inline">|</span>
            <span className="text-white/30 text-sm hidden sm:inline">修改後前台即時更新</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-white/60 hover:text-gold text-sm transition-colors">
              查看前台 ↗
            </Link>
            <button onClick={() => setIsLoggedIn(false)} className="text-white/40 hover:text-white text-sm transition-colors">
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-gold text-navy' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {store.loading ? (
          <p className="text-white/50 text-center py-20">載入中...</p>
        ) : (
          <>
            {activeTab === 'banners' && <BannersAdmin />}
            {activeTab === 'courses' && <CoursesAdmin />}
            {activeTab === 'events' && <EventsAdmin />}
            {activeTab === 'articles' && <ArticlesAdmin />}
            {activeTab === 'coaches' && <CoachesAdmin />}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Shared input style ─── */
const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
const textareaCls = `${inputCls} resize-none`

/* ──────────────── Banners ──────────────── */

function BannersAdmin() {
  const { banners, reload } = useStore()
  const [toast, setToast] = useState('')

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2000) }

  async function updateField(id: string, field: string, value: string | boolean | number) {
    await supabase.from('banners').update({ [field]: value }).eq('id', id)
    await reload()
    showToast('Banner 已更新')
  }

  async function addItem() {
    await supabase.from('banners').insert({ title: '新 Banner', subtitle: '副標題', link_url: '#', sort_order: banners.length + 1 })
    await reload()
    showToast('已新增 Banner')
  }

  async function deleteItem(id: string) {
    await supabase.from('banners').delete().eq('id', id)
    await reload()
    showToast('已刪除')
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">首頁 Banner</h2>
        <button onClick={addItem} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">+ 新增</button>
      </div>
      <div className="space-y-4">
        {banners.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="標題" value={item.title} onChange={(v) => updateField(item.id, 'title', v)} />
              <Field label="副標題" value={item.subtitle} onChange={(v) => updateField(item.id, 'subtitle', v)} />
              <Field label="連結" value={item.link_url} onChange={(v) => updateField(item.id, 'link_url', v)} />
              <div className="flex items-end gap-4">
                <Toggle label="啟用" checked={item.is_active} onChange={(v) => updateField(item.id, 'is_active', v)} />
                <DeleteBtn onClick={() => deleteItem(item.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Courses ──────────────── */

function CoursesAdmin() {
  const { courses, reload } = useStore()
  const [toast, setToast] = useState('')
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2000) }

  async function updateField(id: string, field: string, value: string | boolean | number) {
    await supabase.from('courses').update({ [field]: value }).eq('id', id)
    await reload()
    showToast('課程已更新')
  }

  async function addItem() {
    await supabase.from('courses').insert({ title: '新課程', description: '課程說明', schedule: '每週六 10:00-12:00', location: '場地', age_group: '年齡層', registration_url: 'https://www.empower.com.tw/', sort_order: courses.length + 1 })
    await reload()
    showToast('已新增課程')
  }

  async function deleteItem(id: string) {
    await supabase.from('courses').delete().eq('id', id)
    await reload()
    showToast('已刪除')
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">課程管理</h2>
        <button onClick={addItem} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">+ 新增</button>
      </div>
      <div className="space-y-4">
        {courses.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="課程名稱" value={item.title} onChange={(v) => updateField(item.id, 'title', v)} />
              <Field label="時間" value={item.schedule} onChange={(v) => updateField(item.id, 'schedule', v)} />
              <Field label="地點" value={item.location} onChange={(v) => updateField(item.id, 'location', v)} />
              <Field label="年齡層" value={item.age_group} onChange={(v) => updateField(item.id, 'age_group', v)} />
              <FieldArea label="說明" value={item.description} onChange={(v) => updateField(item.id, 'description', v)} />
              <Field label="報名連結" value={item.registration_url} onChange={(v) => updateField(item.id, 'registration_url', v)} />
              <div className="flex items-end gap-4">
                <Toggle label="上架中" checked={item.is_active} onChange={(v) => updateField(item.id, 'is_active', v)} />
                <DeleteBtn onClick={() => deleteItem(item.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Events ──────────────── */

function EventsAdmin() {
  const { events, reload } = useStore()
  const [toast, setToast] = useState('')
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2000) }

  async function updateField(id: string, field: string, value: string | boolean | number) {
    await supabase.from('events').update({ [field]: value }).eq('id', id)
    await reload()
    showToast('活動已更新')
  }

  async function addItem() {
    await supabase.from('events').insert({ title: '新活動', description: '活動說明', date: '2026-08-01', location: '場地', registration_url: 'https://www.empower.com.tw/', sort_order: events.length + 1 })
    await reload()
    showToast('已新增活動')
  }

  async function deleteItem(id: string) {
    await supabase.from('events').delete().eq('id', id)
    await reload()
    showToast('已刪除')
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">營隊活動</h2>
        <button onClick={addItem} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">+ 新增</button>
      </div>
      <div className="space-y-4">
        {events.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="活動名稱" value={item.title} onChange={(v) => updateField(item.id, 'title', v)} />
              <Field label="日期" value={item.date} onChange={(v) => updateField(item.id, 'date', v)} type="date" />
              <Field label="地點" value={item.location} onChange={(v) => updateField(item.id, 'location', v)} />
              <Field label="報名連結" value={item.registration_url} onChange={(v) => updateField(item.id, 'registration_url', v)} />
              <FieldArea label="說明" value={item.description} onChange={(v) => updateField(item.id, 'description', v)} />
              <div className="flex items-end gap-4">
                <Toggle label="已發佈" checked={item.is_published} onChange={(v) => updateField(item.id, 'is_published', v)} />
                <DeleteBtn onClick={() => deleteItem(item.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Articles ──────────────── */

function ArticlesAdmin() {
  const { articles, reload } = useStore()
  const [toast, setToast] = useState('')
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2000) }

  async function updateField(id: string, field: string, value: string | boolean) {
    await supabase.from('articles').update({ [field]: value }).eq('id', id)
    await reload()
    showToast('文章已更新')
  }

  async function addItem() {
    await supabase.from('articles').insert({ title: '新文章', excerpt: '摘要', content: '文章內容...' })
    await reload()
    showToast('已新增文章')
  }

  async function deleteItem(id: string) {
    await supabase.from('articles').delete().eq('id', id)
    await reload()
    showToast('已刪除')
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">文章管理</h2>
        <button onClick={addItem} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">+ 新增</button>
      </div>
      <div className="space-y-4">
        {articles.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="標題" value={item.title} onChange={(v) => updateField(item.id, 'title', v)} />
              <Field label="發佈日期" value={item.published_at} onChange={(v) => updateField(item.id, 'published_at', v)} type="date" />
              <FieldArea label="摘要" value={item.excerpt} onChange={(v) => updateField(item.id, 'excerpt', v)} />
              <FieldArea label="內容" value={item.content} onChange={(v) => updateField(item.id, 'content', v)} rows={4} />
              <div className="flex items-end gap-4">
                <Toggle label="已發佈" checked={item.is_published} onChange={(v) => updateField(item.id, 'is_published', v)} />
                <DeleteBtn onClick={() => deleteItem(item.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────── Coaches ──────────────── */

function CoachesAdmin() {
  const { coaches, reload } = useStore()
  const [toast, setToast] = useState('')
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 2000) }

  async function updateField(id: string, field: string, value: string | boolean | number) {
    await supabase.from('coaches').update({ [field]: value }).eq('id', id)
    await reload()
    showToast('教練資料已更新')
  }

  async function addItem() {
    await supabase.from('coaches').insert({ name: '新教練', title: '職稱', bio: '教練簡介', sort_order: coaches.length + 1 })
    await reload()
    showToast('已新增教練')
  }

  async function deleteItem(id: string) {
    await supabase.from('coaches').delete().eq('id', id)
    await reload()
    showToast('已刪除')
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">教練管理</h2>
        <button onClick={addItem} className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-gold-dark transition-colors">+ 新增</button>
      </div>
      <div className="space-y-4">
        {coaches.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="姓名" value={item.name} onChange={(v) => updateField(item.id, 'name', v)} />
              <Field label="職稱" value={item.title} onChange={(v) => updateField(item.id, 'title', v)} />
              <FieldArea label="簡介" value={item.bio} onChange={(v) => updateField(item.id, 'bio', v)} />
              <div className="flex items-end gap-4">
                <Toggle label="在職中" checked={item.is_active} onChange={(v) => updateField(item.id, 'is_active', v)} />
                <DeleteBtn onClick={() => deleteItem(item.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Shared Components ─── */

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [local, setLocal] = useState(value)
  return (
    <div>
      <label className="block text-white/50 text-xs mb-1">{label}</label>
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onChange(local) }}
        className={inputCls}
      />
    </div>
  )
}

function FieldArea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [local, setLocal] = useState(value)
  return (
    <div className="md:col-span-2">
      <label className="block text-white/50 text-xs mb-1">{label}</label>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onChange(local) }}
        rows={rows}
        className={textareaCls}
      />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-gold w-4 h-4" />
      <span className="text-white/60 text-sm">{label}</span>
    </label>
  )
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-red-400 hover:text-red-300 text-sm transition-colors">
      刪除
    </button>
  )
}
