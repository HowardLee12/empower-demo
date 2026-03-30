'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-gold font-bold text-xl tracking-wider">
            EMPOWER
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#courses" className="text-white/80 hover:text-gold text-sm transition-colors">
              籃球訓練
            </Link>
            <Link href="/#events" className="text-white/80 hover:text-gold text-sm transition-colors">
              特色營隊
            </Link>
            <Link href="/#articles" className="text-white/80 hover:text-gold text-sm transition-colors">
              最新文章
            </Link>
            <Link href="/#coaches" className="text-white/80 hover:text-gold text-sm transition-colors">
              教練團隊
            </Link>
            <Link href="/#about" className="text-white/80 hover:text-gold text-sm transition-colors">
              關於我們
            </Link>
            <Link href="/#contact" className="text-white/80 hover:text-gold text-sm transition-colors">
              聯絡我們
            </Link>
            <Link
              href="/admin"
              className="bg-gold text-navy px-4 py-1.5 rounded text-sm font-bold hover:bg-gold-dark transition-colors"
            >
              管理後台
            </Link>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {['籃球訓練', '特色營隊', '最新文章', '教練團隊', '關於我們', '聯絡我們'].map((item) => (
              <Link
                key={item}
                href={`/#${item}`}
                className="block text-white/80 hover:text-gold py-2 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <Link
              href="/admin"
              className="block bg-gold text-navy px-4 py-2 rounded text-sm font-bold text-center"
            >
              管理後台
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
