'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/', label: '賽程' },
  { href: '/cups', label: '盃賽' },
  { href: '/teams', label: '隊伍' },
] as const

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-bn-border/50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/empower-logo.svg" alt="EMPOWER" className="h-10" />
            <span className="font-bold text-[18px] tracking-tight text-bn-ink">
              Empower
            </span>
          </Link>

          {/* Pill Nav — desktop */}
          <div className="hidden md:flex items-center bg-[#F0F0EC] p-1 rounded-full gap-0.5">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all ${
                    isActive
                      ? 'bg-bn-ink text-white'
                      : 'text-bn-slate hover:text-bn-ink'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <Link
              href="/management"
              className="px-5 py-2 rounded-full text-[13px] font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            >
              賽事管理
            </Link>
          </div>

          {/* Mobile hamburger */}
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-bn-border/50 pt-3">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block py-3 text-sm font-semibold ${
                    isActive ? 'text-bn-ink' : 'text-bn-slate hover:text-bn-ink'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              )
            })}
            <Link
              href="/management"
              className="block text-center mt-2 px-4 py-3 rounded-full text-sm font-semibold bg-bn-yellow text-bn-ink"
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
