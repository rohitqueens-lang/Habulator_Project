'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'
import type { GroupConfig } from '@/lib/types'
import { GROUPS } from '@/lib/utils'

interface GroupTabsProps {
  activeGroup: string
  onGroupChange: (id: string) => void
}

function Tooltip({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 tooltip-content"
      style={{ whiteSpace: 'nowrap' }}
    >
      {label}
      <div
        className="absolute left-1/2 -bottom-1 -translate-x-1/2 h-2 w-2 rotate-45"
        style={{
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: 'none',
          borderLeft: 'none',
        }}
      />
    </motion.div>
  )
}

function GroupTab({
  group,
  isActive,
  onSelect,
}: {
  group: GroupConfig
  isActive: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative">
      <motion.button
        onClick={group.available ? onSelect : undefined}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileTap={group.available ? { scale: 0.96 } : {}}
        className={[
          'relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2.5 transition-colors',
          group.available ? 'cursor-pointer' : 'cursor-not-allowed',
          isActive
            ? 'text-white'
            : group.available
            ? 'text-white/50 hover:text-white/80'
            : 'text-white/25',
        ].join(' ')}
        style={{
          opacity: group.available ? 1 : 0.5,
        }}
        aria-label={`${group.fullName}${!group.available ? ' – Coming soon' : ''}`}
        aria-selected={isActive}
        role="tab"
      >
        {/* Active background pill */}
        {isActive && (
          <motion.div
            layoutId="activeTabBg"
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(59,130,246,0.12) 100%)`,
              border: '1px solid rgba(34,211,238,0.35)',
              boxShadow: '0 0 16px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          />
        )}

        {/* Label row */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-sm font-700 tracking-wider" style={{ fontWeight: 700 }}>
            {group.label}
          </span>
          {!group.available && (
            <Lock size={10} className="opacity-50" />
          )}
          {isActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: '#22D3EE',
                boxShadow: '0 0 6px #22D3EE',
              }}
            />
          )}
        </div>

        {/* Full name */}
        <span
          className="relative text-[10px] font-medium tracking-wide leading-none"
          style={{ color: isActive ? 'rgba(34,211,238,0.7)' : 'rgba(255,255,255,0.25)' }}
        >
          {group.fullName}
        </span>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && !group.available && (
          <Tooltip label="Coming soon" />
        )}
        {hovered && group.available && !isActive && (
          <Tooltip label={group.fullName} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GroupTabs({ activeGroup, onGroupChange }: GroupTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      role="tablist"
      aria-label="Phytoplankton group selector"
      className="flex items-center gap-1 rounded-2xl p-1.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {GROUPS.map((group) => (
        <GroupTab
          key={group.id}
          group={group}
          isActive={activeGroup === group.id}
          onSelect={() => onGroupChange(group.id)}
        />
      ))}
    </motion.div>
  )
}
