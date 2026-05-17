'use client'

import { useState, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Zap,
  Eye,
  Anchor,
  Calendar,
  Info,
} from 'lucide-react'
import { clamp } from '@/lib/utils'
import type { FeatureConfig } from '@/lib/types'

const ICON_MAP = {
  thermometer: Thermometer,
  droplets: Droplets,
  flask: FlaskConical,
  zap: Zap,
  eye: Eye,
  anchor: Anchor,
  calendar: Calendar,
} as const

interface InputSliderProps extends FeatureConfig {
  value: number
  onChange: (value: number) => void
}

export default function InputSlider({
  label,
  iconName,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  description,
}: InputSliderProps) {
  const [inputStr, setInputStr] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [focused, setFocused] = useState(false)
  const id = useId()

  const Icon = ICON_MAP[iconName]

  const pct = ((value - min) / (max - min)) * 100

  const isOutOfRange = value < min || value > max
  const displayStr = inputStr !== null ? inputStr : String(value)

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value)
      onChange(v)
      setInputStr(null)
    },
    [onChange]
  )

  const handleNumberInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setInputStr(raw)
      const v = parseFloat(raw)
      if (!isNaN(v)) {
        onChange(clamp(v, min, max))
      }
    },
    [onChange, min, max]
  )

  const handleNumberBlur = useCallback(() => {
    setInputStr(null)
    setFocused(false)
    const v = parseFloat(displayStr)
    if (!isNaN(v)) {
      onChange(clamp(v, min, max))
    } else {
      onChange(value)
    }
  }, [displayStr, onChange, min, max, value])

  return (
    <motion.div
      layout
      className="group flex flex-col gap-2"
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.2)',
            }}
          >
            <Icon size={14} className="text-cyan-400" strokeWidth={2} />
          </div>
          <label
            htmlFor={id}
            className="text-sm font-medium text-white/80 cursor-pointer"
          >
            {label}
          </label>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="flex items-center text-white/20 hover:text-white/50 transition-colors focus:outline-none"
              aria-label={`Info about ${label}`}
            >
              <Info size={12} />
            </button>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-6 z-50 w-56 rounded-lg px-3 py-2 text-xs text-white/65 leading-relaxed"
                  style={{
                    background: 'rgba(10,15,30,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {description}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Number input + unit */}
        <div
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors"
          style={{
            background: focused
              ? 'rgba(34,211,238,0.06)'
              : 'rgba(255,255,255,0.04)',
            border: isOutOfRange
              ? '1px solid rgba(239,68,68,0.5)'
              : focused
              ? '1px solid rgba(34,211,238,0.35)'
              : '1px solid rgba(255,255,255,0.08)',
            boxShadow: focused ? '0 0 0 2px rgba(34,211,238,0.1)' : 'none',
          }}
        >
          <input
            id={id}
            type="number"
            value={displayStr}
            min={min}
            max={max}
            step={step}
            onChange={handleNumberInput}
            onFocus={() => setFocused(true)}
            onBlur={handleNumberBlur}
            className="w-16 bg-transparent text-right text-sm font-mono font-medium text-white/90 outline-none"
            aria-label={`${label} value`}
          />
          <span className="text-xs font-medium text-white/30 select-none">{unit}</span>
        </div>
      </div>

      {/* Slider row */}
      <div className="relative flex flex-col gap-1">
        <div className="relative h-4 flex items-center">
          {/* Filled track */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, rgba(34,211,238,0.5) 0%, #22D3EE 100%)',
              boxShadow: '0 0 6px rgba(34,211,238,0.4)',
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSlider}
            className="relative z-10 w-full"
            aria-label={`${label} slider`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
          />
        </div>

        {/* Min/max labels */}
        <div className="flex justify-between">
          <span className="text-[10px] font-medium text-white/20 tabular-nums">
            {min} {unit}
          </span>
          <span className="text-[10px] font-medium text-white/20 tabular-nums">
            {max} {unit}
          </span>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {isOutOfRange && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400/80"
          >
            Value must be between {min} and {max} {unit}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
