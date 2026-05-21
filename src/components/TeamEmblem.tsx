'use client'

/**
 * Team emblem — shows org logo if available, otherwise a gradient
 * color block with the org short_name (2-3 chars).
 */

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #F0B90B, #FFD000)',
  'linear-gradient(135deg, #0EA5E9, #38BDF8)',
  'linear-gradient(135deg, #A855F7, #C084FC)',
  'linear-gradient(135deg, #F6465D, #FB7185)',
  'linear-gradient(135deg, #0ECB81, #34D399)',
  'linear-gradient(135deg, #1F2937, #374151)',
  'linear-gradient(135deg, #D0980B, #F0B90B)',
  'linear-gradient(135deg, #64748B, #94A3B8)',
  'linear-gradient(135deg, #92400E, #B45309)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

interface TeamEmblemProps {
  readonly logoUrl?: string
  readonly shortName: string
  readonly size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { box: 'w-[28px] h-[28px] rounded-[8px] text-[9px]', img: 'w-[28px] h-[28px] rounded-[8px]' },
  md: { box: 'w-[44px] h-[44px] rounded-[14px] text-[13px]', img: 'w-[44px] h-[44px] rounded-[14px]' },
  lg: { box: 'w-[64px] h-[64px] rounded-[20px] text-[18px]', img: 'w-[64px] h-[64px] rounded-[20px]' },
} as const

export function TeamEmblem({ logoUrl, shortName, size = 'md' }: TeamEmblemProps) {
  const s = SIZE_MAP[size]

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={shortName}
        className={`${s.img} object-cover flex-shrink-0`}
      />
    )
  }

  const grad = FALLBACK_GRADIENTS[hashCode(shortName) % FALLBACK_GRADIENTS.length]
  const display = shortName.slice(0, 3)

  return (
    <div
      className={`${s.box} grid place-items-center font-extrabold text-white flex-shrink-0`}
      style={{ background: grad }}
    >
      {display}
    </div>
  )
}
