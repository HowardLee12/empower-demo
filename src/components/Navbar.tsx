'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = 'text-white/50 hover:text-white text-sm font-medium transition-colors'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060f1d]/90 backdrop-blur-lg border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-gold font-black text-lg tracking-widest">
            EMPOWER
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className={linkClass}>賽程</Link>
            <Link href="/scoreboard/history" className={linkClass}>歷史紀錄</Link>
            <Link href="/scoreboard" className={linkClass}>紀錄台</Link>
            <Link
              href="/management"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-gold/10 hover:bg-gold/20 text-gold/70 hover:text-gold border border-gold/10 transition-all"
            >
              賽事管理
            </Link>
          </div>

          <button
            className="md:hidden text-white/60"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-white/[0.04] pt-3">
            {[
              { label: '賽程', href: '/' },
              { label: '歷史紀錄', href: '/scoreboard/history' },
              { label: '紀錄台', href: '/scoreboard' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block text-white/50 hover:text-white py-2.5 text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/management"
              className="block text-center mt-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gold/10 text-gold/70 border border-gold/10"
              onClick={() => setMenuOpen(false)}
            >
              賽事管理
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
