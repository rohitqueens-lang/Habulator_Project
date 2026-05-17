'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { Waves, BarChart3 } from 'lucide-react'
import BloomBadge from './BloomBadge'
import PredictionRange from './PredictionRange'
import ShapChart from './ShapChart'
import { getBloomLevel, formatMgL } from '@/lib/utils'
import type { PredictionResult } from '@/lib/types'

interface ResultPanelProps {
  result: PredictionResult | null
  loading: boolean
}

function AnimatedNumber({ target }: { target: number }) {
  const mv = useMotionValue(0)
  const displayRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(mv, target, {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => {
        if (displayRef.current) {
          displayRef.current.textContent = formatMgL(v)
        }
      },
    })
    return () => controls.stop()
  }, [target, mv])

  return (
    <span
      ref={displayRef}
      className="font-bold tabular-nums"
      style={{
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        lineHeight: 1,
        background: 'linear-gradient(135deg, #22D3EE 0%, #67E8F9 60%, #0EA5E9 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.2))',
      }}
    >
      {formatMgL(0)}
    </span>
  )
}

function Divider() {
  return (
    <div
      className="w-full"
      style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }}
    />
  )
}

function SkeletonBlock({ h, w = '100%' }: { h: number; w?: string }) {
  return (
    <div
      className="skeleton rounded-lg"
      style={{ height: h, width: w }}
    />
  )
}

function LoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 px-6 py-6"
    >
      {/* Big number skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock h={56} w="60%" />
        <SkeletonBlock h={28} w="40%" />
      </div>
      <Divider />
      {/* Range skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock h={14} w="35%" />
        <SkeletonBlock h={8} />
        <div className="flex justify-between">
          <SkeletonBlock h={12} w="15%" />
          <SkeletonBlock h={12} w="15%" />
          <SkeletonBlock h={12} w="15%" />
        </div>
      </div>
      <Divider />
      {/* SHAP skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock h={14} w="40%" />
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} h={28} w={`${85 - i * 8}%`} />
        ))}
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col items-center justify-center px-8 py-16"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: 'backOut' }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: 'rgba(34,211,238,0.05)',
          border: '1px dashed rgba(34,211,238,0.2)',
        }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Waves size={32} className="text-slate-200" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-base font-semibold text-slate-300"
      >
        No prediction yet
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="text-center text-sm text-slate-400 max-w-[240px] leading-relaxed"
      >
        Adjust the environmental parameters and click{' '}
        <span className="text-slate-500 font-medium">Predict Biovolume</span>
      </motion.p>

      {/* Dashed border container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-col gap-2 w-full max-w-xs"
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px dashed rgba(0,0,0,0.06)',
              opacity: 1 - i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

function ResultContent({ result }: { result: PredictionResult }) {
  const level = getBloomLevel(result.pred_mgL)

  const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  }

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 px-6 py-6"
    >
      {/* Hero number */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-2"
      >
        <div className="flex items-baseline gap-2.5">
          <AnimatedNumber target={result.pred_mgL} />
          <span className="text-lg font-medium text-slate-400 pb-1">mg/L</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <BloomBadge level={level} size="md" />
          <span className="text-xs text-slate-400 font-medium">
            EDIAT Biovolume · XGBoost
          </span>
        </div>
      </motion.div>

      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="show">
        <Divider />
      </motion.div>

      {/* Prediction range */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="show">
        <PredictionRange
          lower={result.lower_mgL}
          pred={result.pred_mgL}
          upper={result.upper_mgL}
        />
      </motion.div>

      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="show">
        <Divider />
      </motion.div>

      {/* SHAP chart */}
      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="show">
        <ShapChart entries={result.shap} baseVal={result.base_val} />
      </motion.div>
    </motion.div>
  )
}

export default function ResultPanel({ result, loading }: ResultPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card-lg flex flex-col overflow-hidden"
      style={{ minHeight: '500px' }}
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.2)',
          }}
        >
          <BarChart3 size={15} className="text-cyan-400" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 tracking-wide">Prediction Results</h2>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">
            {result ? 'EDIAT Biovolume · mg/L' : 'Awaiting input'}
          </p>
        </div>

        {result && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E' }}
            />
            <span className="text-[10px] font-semibold text-green-600 tracking-wide">
              Complete
            </span>
          </motion.div>
        )}
      </div>

      {/* Content area */}
      <div className="relative flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingState key="loading" />
          ) : result ? (
            <ResultContent key="result" result={result} />
          ) : (
            <EmptyState key="empty" />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
