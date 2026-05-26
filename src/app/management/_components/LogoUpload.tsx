'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  value: string
  onChange: (url: string) => void
  shortName: string
}

export function LogoUpload({ value, onChange, shortName }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔案')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('檔案太大,請小於 2MB')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage.from('logos').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
      })
      if (upErr) {
        setError(`上傳失敗: ${upErr.message}`)
        return
      }
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (e) {
      setError(`錯誤: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt={shortName} className="w-16 h-16 rounded-[12px] object-cover border border-bn-border" />
        ) : (
          <div className="w-16 h-16 rounded-[12px] bg-bn-snow border border-bn-border grid place-items-center text-bn-slate text-xs">
            無 logo
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-[6px] text-xs font-semibold bg-bn-yellow text-bn-ink hover:bg-bn-gold disabled:opacity-50 transition-colors"
          >
            {uploading ? '上傳中...' : value ? '更換 logo' : '上傳 logo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="ml-2 px-4 py-2 rounded-[6px] text-xs font-semibold text-bn-slate hover:text-bn-red transition-colors"
            >
              移除
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-bn-red text-xs">{error}</p>}
      <p className="text-bn-muted text-[10px]">建議使用正方形圖片,小於 2MB(PNG/JPG/WebP)</p>
    </div>
  )
}
