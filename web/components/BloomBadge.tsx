'use client'

import { motion } from 'framer-motion'
import { getBloomColor, getBloomLabel } from '@/lib/utils'
import type { BloomLevel } from '@/lib/types'

interface BloomBadgeProps {
  level: BloomLevel
  size?: 'sm' | 'md' | 'lg'
}

export default function BloomBadge({ level, size = 'md' }: BloomBadgeProps) {
  const color = getBloomColor(level)
  const label = getBloomLabel(level)

  const sizeMap = {
    sm: { pill: 'px-2.5 py-1', dot: 'h-1.5 w-1.5', text: 'text-xs' },
    md: { pill: 'px-3 py-1.5', dot: 'h-2 w-2', text: 'text-sm' },
    lg: { pill: 'px-4 py-2', dot: 'h-2.5 w-2.5', text: 'text-base' },
  }

  const s = sizeMap[size]

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
      className={`inline-flex items-center gap-2 rounded-full ${s.pill}`}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 12px ${color}20`,
      }}
      role="status"
      aria-label={`Bloom level: ${label}`}
    >
      {/* Pulsing dot */}
      <div className="relative flex items-center justify-center">
        <motion.span
          className={`absolute rounded-full opacity-50`}
          style={{
            background: color,
            width: '200%',
            height: '200%',
          }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span
          className={`${s.dot} rounded-full relative`}
          style={{
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>

      <span
        className={`${s.text} font-semibold tracking-wide`}
        style={{ color }}
      >
        {label}
      </span>
    </motion.div>
  )
}
