'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react'
import InputSlider from './InputSlider'
import { FEATURES } from '@/lib/utils'
import type { InputFeatures } from '@/lib/types'

interface InputPanelProps {
  values: InputFeatures
  onChange: (key: keyof InputFeatures, value: number) => void
  onPredict: () => void
  loading: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export default function InputPanel({ values, onChange, onPredict, loading }: InputPanelProps) {
  const handleChange = useCallback(
    (key: keyof InputFeatures) => (value: number) => {
      onChange(key, value)
    },
    [onChange]
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card-lg flex flex-col gap-0 overflow-hidden"
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.2)',
          }}
        >
          <SlidersHorizontal size={15} className="text-cyan-400" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/90 tracking-wide">Input Parameters</h2>
          <p className="text-[11px] text-white/30 font-medium tracking-wide">
            7 environmental predictors
          </p>
        </div>
      </div>

      {/* Sliders */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5 px-6 py-5"
      >
        {FEATURES.map((feat) => (
          <motion.div key={feat.key} variants={itemVariants}>
            <InputSlider
              {...feat}
              value={values[feat.key]}
              onChange={handleChange(feat.key)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Divider */}
      <div
        className="mx-6"
        style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }}
      />

      {/* Predict button */}
      <div className="px-6 py-5">
        <motion.button
          onClick={onPredict}
          disabled={loading}
          whileHover={!loading ? { scale: 1.01 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="btn-predict relative w-full rounded-xl py-3.5 text-sm font-semibold text-white tracking-wide flex items-center justify-center gap-2.5 overflow-hidden"
          aria-label={loading ? 'Computing prediction...' : 'Run prediction'}
        >
          {/* Shimmer overlay */}
          {!loading && (
            <motion.div
              className="absolute inset-0 opacity-0 hover:opacity-100"
              style={{
                background:
                  'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Computing...</span>
            </>
          ) : (
            <>
              <span>Predict Biovolume</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </motion.button>

        <p className="mt-3 text-center text-[10px] font-medium text-white/20 tracking-wide">
          XGBoost · Conformal Prediction · ±90% CI
        </p>
      </div>
    </motion.div>
  )
}
