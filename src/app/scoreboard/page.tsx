'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScoreboardRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/management') }, [router])
  return (
    <div className="min-h-screen bg-bn-dark flex items-center justify-center">
      <p className="text-bn-slate text-sm">正在跳轉到賽事管理...</p>
    </div>
  )
}
