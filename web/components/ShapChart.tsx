'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { formatShap, FEAT_DISPLAY_LABELS, FEAT_SIMPLE_LABELS, FEAT_UNITS } from '@/lib/utils'
import type { ShapEntry } from '@/lib/types'

interface ShapChartProps {
  entries: ShapEntry[]
  baseVal: number
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-white/25 hover:text-white/55 transition-colors focus:outline-none"
        aria-label="What is SHAP?"
      >
        <Info size={13} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-6 z-50 w-64 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{
              background: 'rgba(10,15,30,0.96)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>SHAP</span> (SHapley
            Additive exPlanations) shows how each feature pushed the prediction up{' '}
            <span style={{ color: '#F97316' }}>▲ orange</span> or down{' '}
            <span style={{ color: '#3B82F6' }}>▼ blue</span> from the model baseline.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ShapBarProps {
  entry: ShapEntry
  maxAbs: number
  index: number
  simple: boolean
}

function ShapBar({ entry, maxAbs, index, simple }: ShapBarProps) {
  const isPositive = entry.shap >= 0
  const barPct = maxAbs > 0 ? (Math.abs(entry.shap) / maxAbs) * 45 : 0 // 45% of half-width
  const color = isPositive ? '#F97316' : '#3B82F6'
  const label = simple
    ? FEAT_SIMPLE_LABELS[entry.feature] ?? entry.feature
    : FEAT_DISPLAY_LABELS[entry.feature] ?? entry.feature
  const unit = FEAT_UNITS[entry.feature] ?? ''
  const valStr = typeof entry.value === 'number'
    ? unit
      ? `${entry.value.toPrecision(3)} ${unit}`
      : entry.value.toPrecision(3)
    : String(entry.value)

  return (
    <motion.div
      initial={{ opacity: 0, x: isPositive ? -8 : 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="flex items-center gap-0 w-full"
      style={{ minHeight: '36px' }}
    >
      {/* Feature name — left half */}
      <div className="flex flex-col justify-center" style={{ width: '40%', paddingRight: '12px' }}>
        <span className="text-xs font-medium text-white/70 truncate leading-tight">{label}</span>
        {!simple && (
          <span className="text-[10px] text-white/25 font-mono leading-tight truncate">
            {valStr}
          </span>
        )}
      </div>

      {/* Chart — right 60% with center zero */}
      <div className="relative flex items-center" style={{ width: '60%', height: '28px' }}>
        {/* Center zero line */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{
            left: '50%',
            width: '1px',
            background: 'rgba(255,255,255,0.12)',
          }}
        />

        {/* Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ delay: 0.1 + index * 0.05, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm"
          style={{
            [isPositive ? 'left' : 'right']: '50%',
            background: isPositive
              ? 'linear-gradient(90deg, rgba(249,115,22,0.3) 0%, rgba(249,115,22,0.7) 100%)'
              : 'linear-gradient(270deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.7) 100%)',
            boxShadow: `0 0 8px ${color}30`,
          }}
        />

        {/* SHAP value label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          className="absolute text-[10px] font-mono font-semibold whitespace-nowrap"
          style={{
            [isPositive ? 'left' : 'right']: `calc(50% + ${barPct}% + 4px)`,
            color,
          }}
        >
          {isPositive ? '+' : ''}
          {simple ? (Math.abs(entry.shap) > 0.1 ? 'High' : Math.abs(entry.shap) > 0.01 ? 'Mid' : 'Low') : formatShap(entry.shap)}
        </motion.span>
      </div>
    </motion.div>
  )
}

export default function ShapChart({ entries, baseVal }: ShapChartProps) {
  const [simple, setSimple] = useState(false)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap)),
    [entries]
  )

  const displayed = simple ? sorted.slice(0, 4) : sorted
  const maxAbs = Math.max(...sorted.map((e) => Math.abs(e.shap)), 0.001)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-white/50 tracking-widest uppercase">
            Why this prediction?
          </h3>
          <InfoTooltip text="" />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-4 rounded-sm"
              style={{ background: 'rgba(249,115,22,0.6)' }}
            />
            <span className="text-[10px] text-white/30 font-medium">Increases</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-4 rounded-sm"
              style={{ background: 'rgba(59,130,246,0.6)' }}
            />
            <span className="text-[10px] text-white/30 font-medium">Decreases</span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div
        className="rounded-xl px-4 py-3 flex flex-col divide-y"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          divideColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {displayed.map((entry, i) => (
            <div
              key={entry.feature}
              style={{ paddingTop: i === 0 ? 0 : '4px', paddingBottom: '4px' }}
            >
              <ShapBar
                entry={entry}
                maxAbs={maxAbs}
                index={i}
                simple={simple}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Baseline note */}
      {!simple && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[10px] text-white/20 font-medium text-center"
        >
          Model baseline (log-scale):{' '}
          <span className="text-white/35 font-mono">{baseVal.toFixed(3)}</span>
        </motion.p>
      )}

      {/* Simple / Technical toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setSimple((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/35 hover:text-white/60 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          aria-pressed={simple}
        >
          {simple ? (
            <>
              <ChevronDown size={12} />
              Technical view
            </>
          ) : (
            <>
              <ChevronUp size={12} />
              Simple view
            </>
          )}
        </button>
      </div>
    </div>
  )
}
