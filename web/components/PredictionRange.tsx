'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { formatMgL } from '@/lib/utils'

interface PredictionRangeProps {
  lower: number
  pred: number
  upper: number
}

function Marker({
  label,
  value,
  pct,
  size,
  color,
  delay,
}: {
  label: string
  value: number
  pct: number
  size: 'sm' | 'lg'
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="absolute flex flex-col items-center"
      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
    >
      {/* Dot */}
      {size === 'lg' ? (
        <div className="relative flex items-center justify-center mb-1">
          <motion.div
            className="absolute rounded-full opacity-30"
            style={{ background: color, width: 28, height: 28 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <div
            className="relative z-10 h-4 w-4 rounded-full"
            style={{
              background: color,
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
            }}
          />
        </div>
      ) : (
        <div
          className="h-2.5 w-2.5 rounded-full mb-1"
          style={{
            background: color,
            border: '1.5px solid rgba(255,255,255,0.6)',
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      )}
    </motion.div>
  )
}

export default function PredictionRange({ lower, pred, upper }: PredictionRangeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setAnimated(true), 100)
      return () => clearTimeout(t)
    }
  }, [inView])

  // Compute percentages. We pad the range a bit so markers don't clip edges.
  const span = upper - lower
  const padded = span * 0.25
  const rangeMin = Math.max(0, lower - padded)
  const rangeMax = upper + padded

  const toPct = (v: number) =>
    Math.min(100, Math.max(0, ((v - rangeMin) / (rangeMax - rangeMin)) * 100))

  const lowerPct = toPct(lower)
  const predPct = toPct(pred)
  const upperPct = toPct(upper)

  // Confidence interval band
  const bandLeft = lowerPct
  const bandWidth = upperPct - lowerPct

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
          Confidence Interval
        </h3>
        <span className="text-[10px] font-medium text-slate-400 tracking-wide">
          90% coverage
        </span>
      </div>

      {/* Track container */}
      <div className="relative" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        {/* Base track */}
        <div
          className="relative h-2 w-full rounded-full"
          style={{ background: '#F1F5F9' }}
        >
          {/* Gradient confidence band */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={animated ? { width: `${bandWidth}%`, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
            className="absolute top-0 h-full rounded-full origin-left"
            style={{
              left: `${bandLeft}%`,
              background:
                'linear-gradient(90deg, rgba(59,130,246,0.6) 0%, rgba(34,211,238,0.5) 40%, rgba(249,115,22,0.6) 100%)',
              boxShadow: '0 0 8px rgba(34,211,238,0.2)',
            }}
          />

          {/* Best estimate line — full-height tick */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={animated ? { opacity: 1, scaleY: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute top-1/2 -translate-y-1/2 origin-center"
            style={{
              left: `${predPct}%`,
              transform: `translateX(-50%) translateY(-50%)`,
              width: '2px',
              height: '24px',
              background: 'rgba(15,23,42,0.5)',
              borderRadius: '1px',
            }}
          />

          {/* Markers (above track) */}
          {/* Lower */}
          <Marker
            label="Low"
            value={lower}
            pct={lowerPct}
            size="sm"
            color="#3B82F6"
            delay={0.3}
          />
          {/* Best */}
          <Marker
            label="Best"
            value={pred}
            pct={predPct}
            size="lg"
            color="#22D3EE"
            delay={0.5}
          />
          {/* Upper */}
          <Marker
            label="High"
            value={upper}
            pct={upperPct}
            size="sm"
            color="#F97316"
            delay={0.3}
          />
        </div>

        {/* Labels below track */}
        <div className="relative mt-4" style={{ height: '40px' }}>
          {/* Lower label */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute flex flex-col items-center"
            style={{ left: `${lowerPct}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-xs font-medium" style={{ color: '#3B82F6' }}>
              {formatMgL(lower)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Low</span>
          </motion.div>

          {/* Best label */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="absolute flex flex-col items-center"
            style={{ left: `${predPct}%`, transform: 'translateX(-50%)' }}
          >
            <span
              className="text-sm font-semibold"
              style={{
                color: '#22D3EE',
                textShadow: '0 0 10px rgba(34,211,238,0.3)',
              }}
            >
              {formatMgL(pred)}
            </span>
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: 'rgba(34,211,238,0.7)' }}>
              Best
            </span>
          </motion.div>

          {/* Upper label */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute flex flex-col items-center"
            style={{ left: `${upperPct}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-xs font-medium" style={{ color: '#F97316' }}>
              {formatMgL(upper)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">High</span>
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-3 rounded-full" style={{ background: '#3B82F6' }} />
          <span className="text-[10px] text-slate-400 font-medium">Lower bound</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: '#22D3EE', boxShadow: '0 0 6px #22D3EE' }}
          />
          <span className="text-[10px] text-slate-400 font-medium">Best estimate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-3 rounded-full" style={{ background: '#F97316' }} />
          <span className="text-[10px] text-slate-400 font-medium">Upper bound</span>
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-400 font-medium tracking-wide">
        Conformal prediction interval · 90% nominal coverage
      </p>
    </div>
  )
}
