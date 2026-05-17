'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sliders, BarChart2 } from 'lucide-react'
import Header from '@/components/Header'
import GroupTabs from '@/components/GroupTabs'
import InputPanel from '@/components/InputPanel'
import ResultPanel from '@/components/ResultPanel'
import BatchPanel from '@/components/BatchPanel'
import { predict, ApiError } from '@/lib/api'
import { FEATURES } from '@/lib/utils'
import type { InputFeatures, PredictionResult } from '@/lib/types'

function buildDefaults(): InputFeatures {
  return Object.fromEntries(
    FEATURES.map((f) => [f.key, f.defaultValue])
  ) as InputFeatures
}

export default function HomePage() {
  const [activeGroup, setActiveGroup] = useState('EDIAT')
  const [values, setValues] = useState<InputFeatures>(buildDefaults)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  const handleChange = useCallback((key: keyof InputFeatures, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handlePredict = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await predict(activeGroup, values)
      setResult(res)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? err.message)
      } else if (err instanceof Error) {
        if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
          setError('Request timed out. Make sure the API server is running.')
        } else if (err.message.includes('fetch')) {
          setError('Cannot reach the API server. Please check your connection and that the backend is running.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }, [activeGroup, values])

  const handleGroupChange = useCallback((id: string) => {
    setActiveGroup(id)
    setResult(null)
    setError(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Top bar: title + mode toggle + group tabs */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-xl font-bold text-white/85 tracking-tight"
            >
              Phytoplankton Biovolume Prediction
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-sm text-white/35 font-medium"
            >
              Select an algal group, adjust environmental parameters, and run the model.
            </motion.p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode toggle */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: 4,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <button
                onClick={() => setMode('single')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  background: mode === 'single' ? '#06b6d4' : 'transparent',
                  color: mode === 'single' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                }}
              >
                <Sliders size={14} />
                Single
              </button>
              <button
                onClick={() => setMode('batch')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  background: mode === 'batch' ? '#06b6d4' : 'transparent',
                  color: mode === 'batch' ? '#ffffff' : 'rgba(255,255,255,0.5)',
                }}
              >
                <BarChart2 size={14} />
                Batch
              </button>
            </motion.div>

            <GroupTabs activeGroup={activeGroup} onGroupChange={handleGroupChange} />
          </div>
        </div>

        {/* Error banner (single mode only) */}
        {error && mode === 'single' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
            role="alert"
          >
            <span className="text-red-400 font-semibold text-sm flex-shrink-0 mt-0.5">Error</span>
            <p className="text-red-300/80 text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400/60 hover:text-red-300/80 transition-colors text-xs font-medium flex-shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Content area */}
        {mode === 'single' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr] xl:grid-cols-[460px_1fr]">
            <InputPanel
              values={values}
              onChange={handleChange}
              onPredict={handlePredict}
              loading={loading}
            />
            <ResultPanel result={result} loading={loading} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BatchPanel activeGroup={activeGroup} />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="py-6 text-center"
      >
        <p className="text-[11px] font-medium text-slate-400 tracking-wide">
          Habulator v1.0&nbsp;&nbsp;·&nbsp;&nbsp;XGBoost + Conformal Prediction&nbsp;&nbsp;·&nbsp;&nbsp;Shukla Lab
        </p>
      </motion.footer>
    </div>
  )
}
