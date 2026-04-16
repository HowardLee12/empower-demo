'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bn-dark/95 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-bn-yellow font-bold text-xl tracking-wider">
            EMPOWER
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-bn-slate hover:text-white text-sm font-semibold transition-colors">
              賽程
            </Link>
            <Link href="/scoreboard/history" className="text-bn-slate hover:text-white text-sm font-semibold transition-colors">
              歷史紀錄
            </Link>
            <Link
              href="/management"
              className="px-5 py-2 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors shadow-[rgb(153,153,153)_0px_2px_10px_-3px]"
            >
              賽事管理
            </Link>
          </div>

          <button
            className="md:hidden text-bn-slate"
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
          <div className="md:hidden pb-4 space-y-1 border-t border-white/[0.06] pt-3">
            <Link href="/" className="block text-bn-slate hover:text-white py-3 text-sm font-semibold" onClick={() => setMenuOpen(false)}>
              賽程
            </Link>
            <Link href="/scoreboard/history" className="block text-bn-slate hover:text-white py-3 text-sm font-semibold" onClick={() => setMenuOpen(false)}>
              歷史紀錄
            </Link>
            <Link href="/management" className="block text-center mt-2 px-4 py-3 rounded-[50px] text-sm font-semibold bg-bn-yellow text-bn-ink" onClick={() => setMenuOpen(false)}>
              賽事管理
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
