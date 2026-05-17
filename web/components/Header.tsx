'use client'

import { motion } from 'framer-motion'
import { Github, Waves } from 'lucide-react'

export default function Header() {
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(10,15,30,0.7)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: 'backOut' }}
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(59,130,246,0.2) 100%)',
              border: '1px solid rgba(34,211,238,0.3)',
              boxShadow: '0 0 16px rgba(34,211,238,0.15)',
            }}
          >
            <Waves size={18} className="text-cyan-400" strokeWidth={2} />
          </motion.div>

          <div className="flex flex-col">
            <span
              className="text-lg font-800 tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #22D3EE 0%, #67E8F9 60%, #a5f3fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800,
                letterSpacing: '0.12em',
              }}
            >
              HABULATOR
            </span>
            <span className="text-[10px] font-medium tracking-widest text-white/30 leading-none">
              GREAT LAKES&nbsp;·&nbsp;PHYTOPLANKTON PREDICTOR
            </span>
          </div>
        </div>

        {/* Right badges */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="hidden items-center gap-2 rounded-full px-3 py-1.5 sm:flex"
            style={{
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.2)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: '#22D3EE', boxShadow: '0 0 6px #22D3EE' }}
            />
            <span className="text-xs font-medium text-cyan-300/80 tracking-wide">
              Great Lakes 2001–2022
            </span>
          </motion.div>

          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition-colors hover:text-white/70"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
            }}
            aria-label="View on GitHub"
          >
            <Github size={16} />
          </motion.a>
        </div>
      </div>
    </motion.header>
  )
}
