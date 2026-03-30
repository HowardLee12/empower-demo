'use client'

export function Footer() {
  return (
    <footer className="bg-navy border-t border-white/10 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-gold font-bold text-lg mb-2">EMPOWER</p>
        <p className="text-white/50 text-sm mb-4">引爆你的運動潛能</p>
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="text-white/50 hover:text-gold text-sm transition-colors">Facebook</a>
          <a href="#" className="text-white/50 hover:text-gold text-sm transition-colors">Instagram</a>
          <a href="#" className="text-white/50 hover:text-gold text-sm transition-colors">YouTube</a>
        </div>
        <p className="text-white/30 text-xs">&copy; 2026 EMPOWER. All rights reserved.</p>
      </div>
    </footer>
  )
}
