'use client'

import { useStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function Home() {
  const { banners, coaches, events, articles, courses } = useStore()

  const activeBanners = banners.filter((b) => b.is_active)
  const activeCoaches = coaches.filter((c) => c.is_active)
  const publishedEvents = events.filter((e) => e.is_published)
  const publishedArticles = articles.filter((a) => a.is_published)
  const activeCourses = courses.filter((c) => c.is_active)

  return (
    <>
      <Navbar />

      {/* Hero / Banner */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-navy via-navy-light to-navy pt-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative text-center px-4">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            {activeBanners[0]?.title || 'EMPOWER'}
          </h1>
          <p className="text-xl md:text-2xl text-gold font-medium mb-8">
            {activeBanners[0]?.subtitle || '引爆你的運動潛能'}
          </p>
          <a
            href="#events"
            className="inline-block bg-gold text-navy px-8 py-3 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors"
          >
            立即報名
          </a>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="py-20 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">籃球訓練</h2>
          <p className="text-white/50 text-center mb-12">系統化訓練課程，適合各年齡層</p>
          <div className="grid md:grid-cols-3 gap-6">
            {activeCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-gold/30 transition-colors"
              >
                <div className="w-full h-40 bg-navy-light rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">🏀</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                <p className="text-white/60 text-sm mb-3">{course.description}</p>
                <div className="space-y-1 text-sm text-white/50 mb-4">
                  <p>📅 {course.schedule}</p>
                  <p>📍 {course.location}</p>
                  <p>👥 {course.age_group}</p>
                </div>
                <a
                  href={course.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-gold/10 text-gold border border-gold/30 rounded-lg py-2 text-sm font-medium hover:bg-gold/20 transition-colors"
                >
                  立即報名
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-20 bg-navy-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">特色營隊</h2>
          <p className="text-white/50 text-center mb-12">限時營隊活動，名額有限</p>
          <div className="grid md:grid-cols-3 gap-6">
            {publishedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-gold/30 transition-colors"
              >
                <div className="h-48 bg-navy flex items-center justify-center">
                  <span className="text-5xl">⛹️</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-white/60 text-sm mb-3">{event.description}</p>
                  <div className="space-y-1 text-sm text-white/50 mb-4">
                    <p>📅 {event.date}</p>
                    <p>📍 {event.location}</p>
                  </div>
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-gold text-navy rounded-lg py-2 text-sm font-bold hover:bg-gold-dark transition-colors"
                  >
                    報名去 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="py-20 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">最新文章</h2>
          <p className="text-white/50 text-center mb-12">賽事報導與訓練紀實</p>
          <div className="grid md:grid-cols-2 gap-6">
            {publishedArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-gold/30 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-navy-light rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="text-3xl">📰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{article.title}</h3>
                    <p className="text-white/40 text-xs mb-2">{article.published_at}</p>
                    <p className="text-white/60 text-sm">{article.excerpt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section id="coaches" className="py-20 bg-navy-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">教練團隊</h2>
          <p className="text-white/50 text-center mb-12">專業師資陣容</p>
          <div className="grid md:grid-cols-3 gap-6">
            {activeCoaches.map((coach) => (
              <div
                key={coach.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-gold/30 transition-colors"
              >
                <div className="w-24 h-24 bg-navy rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-lg font-bold text-white">{coach.name}</h3>
                <p className="text-gold text-sm mb-2">{coach.title}</p>
                <p className="text-white/60 text-sm">{coach.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-navy">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">關於 EMPOWER</h2>
          <p className="text-white/70 leading-relaxed">
            EMPOWER 引爆運動行銷團隊致力於推廣籃球運動，透過系統化的訓練課程、特色營隊活動、
            以及國際交流機會，幫助每一位球員發揮最大潛能。我們相信運動不只是技術的磨練，
            更是品格與團隊精神的養成。
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-navy-light">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">聯絡我們</h2>
          <p className="text-white/50 text-center mb-8">有任何問題歡迎來信</p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="姓名"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
            />
            <input
              type="tel"
              placeholder="電話"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
            />
            <textarea
              placeholder="訊息內容"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 resize-none"
            />
            <button
              type="submit"
              className="w-full bg-gold text-navy py-3 rounded-lg font-bold hover:bg-gold-dark transition-colors"
            >
              送出
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  )
}
