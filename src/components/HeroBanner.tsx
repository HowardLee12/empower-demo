'use client'

import { useState, useEffect, useCallback } from 'react'
import { Banner } from '@/lib/types'

interface HeroBannerProps {
  banners: Banner[]
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const total = banners.length

  const goTo = useCallback(
    (index: number) => {
      if (index === current || isTransitioning) return
      setIsTransitioning(true)
      setCurrent(index)
      setTimeout(() => setIsTransitioning(false), 500)
    },
    [current, isTransitioning]
  )

  const goNext = useCallback(() => {
    goTo((current + 1) % total)
  }, [current, total, goTo])

  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [total, goNext])

  if (total === 0) {
    return (
      <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-navy via-navy-light to-navy pt-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative text-center px-4">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            EMPOWER
          </h1>
          <p className="text-xl md:text-2xl text-gold font-medium mb-8">
            引爆你的運動潛能
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-navy via-navy-light to-navy pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      {/* Slides */}
      <div className="relative w-full h-full flex items-center justify-center">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {banner.image_url && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${banner.image_url})` }}
              >
                <div className="absolute inset-0 bg-navy/60" />
              </div>
            )}
            <div className="relative text-center px-4">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
                {banner.title}
              </h1>
              <p className="text-xl md:text-2xl text-gold font-medium mb-8">
                {banner.subtitle}
              </p>
              <a
                href={banner.link_url || '#events'}
                className="inline-block bg-gold text-navy px-8 py-3 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors"
              >
                立即報名
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Left / Right arrows */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + total) % total)}
            className="absolute left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="上一張"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goTo((current + 1) % total)}
            className="absolute right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="下一張"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-6 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === current
                  ? 'bg-gold w-6'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`第 ${index + 1} 張`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
