import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A0F1E',
          50: '#0D1428',
          100: '#101929',
          200: '#141f35',
          300: '#1a2540',
          400: '#212d4d',
        },
        cyan: {
          DEFAULT: '#22D3EE',
          glow: 'rgba(34,211,238,0.3)',
          dim: 'rgba(34,211,238,0.12)',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.07)',
        },
        bloom: {
          low: '#22C55E',
          moderate: '#EAB308',
          elevated: '#F97316',
          high: '#EF4444',
        },
        shap: {
          positive: '#F97316',
          negative: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        cyan: '0 0 20px rgba(34,211,238,0.35), 0 0 60px rgba(34,211,238,0.1)',
        'cyan-sm': '0 0 10px rgba(34,211,238,0.25)',
        bloom: '0 0 16px rgba(34,197,94,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 12s ease infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
        '.glass-hover': {
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
        '.glass-active': {
          background: 'rgba(34,211,238,0.12)',
          border: '1px solid rgba(34,211,238,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
        '.text-gradient-cyan': {
          background: 'linear-gradient(135deg, #22D3EE 0%, #67E8F9 50%, #a5f3fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.glow-cyan': {
          boxShadow: '0 0 20px rgba(34,211,238,0.35), 0 0 60px rgba(34,211,238,0.1)',
        },
      })
    },
  ],
}

export default config
