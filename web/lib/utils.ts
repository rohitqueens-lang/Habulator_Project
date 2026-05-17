import type { BloomLevel, GroupConfig, FeatureConfig } from './types'

// ─── Bloom classification ────────────────────────────────────────────────────
export function getBloomLevel(mgL: number): BloomLevel {
  if (mgL < 0.5) return 'low'
  if (mgL < 2) return 'moderate'
  if (mgL < 5) return 'elevated'
  return 'high'
}

export function getBloomLabel(level: BloomLevel): string {
  switch (level) {
    case 'low':
      return 'Low Bloom'
    case 'moderate':
      return 'Moderate Bloom'
    case 'elevated':
      return 'Elevated Bloom'
    case 'high':
      return 'High Bloom'
  }
}

export function getBloomColor(level: BloomLevel): string {
  switch (level) {
    case 'low':
      return '#22C55E'
    case 'moderate':
      return '#EAB308'
    case 'elevated':
      return '#F97316'
    case 'high':
      return '#EF4444'
  }
}

export function getBloomEmoji(level: BloomLevel): string {
  switch (level) {
    case 'low':
      return '●'
    case 'moderate':
      return '●'
    case 'elevated':
      return '●'
    case 'high':
      return '●'
  }
}

// ─── Number formatting ────────────────────────────────────────────────────────
export function formatMgL(v: number): string {
  if (v >= 100) return v.toFixed(0)
  if (v >= 10) return v.toFixed(1)
  if (v >= 1) return v.toFixed(2)
  if (v >= 0.01) return v.toFixed(3)
  return v.toExponential(2)
}

export function formatShap(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 10) return v.toFixed(1)
  if (abs >= 1) return v.toFixed(2)
  return v.toFixed(3)
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

// ─── Group configs ────────────────────────────────────────────────────────────
export const GROUPS: GroupConfig[] = [
  {
    id: 'EDIAT',
    label: 'EDIAT',
    fullName: 'Euglenoids & Diatoms',
    color: '#22D3EE',
    available: true,
  },
  {
    id: 'LDIAT',
    label: 'LDIAT',
    fullName: 'Large Diatoms',
    color: '#818CF8',
    available: false,
  },
  {
    id: 'CHLOR',
    label: 'CHLOR',
    fullName: 'Chlorophytes',
    color: '#4ADE80',
    available: false,
  },
  {
    id: 'CRYPT',
    label: 'CRYPT',
    fullName: 'Cryptophytes',
    color: '#FB923C',
    available: false,
  },
  {
    id: 'CYANO',
    label: 'CYANO',
    fullName: 'Cyanobacteria',
    color: '#F87171',
    available: false,
  },
]

// ─── Feature configs ──────────────────────────────────────────────────────────
export const FEATURES: FeatureConfig[] = [
  {
    key: 'TEMP',
    label: 'Temperature',
    unit: '°C',
    min: 0,
    max: 30,
    step: 0.1,
    defaultValue: 12,
    description: 'Surface water temperature. Warmer temps accelerate phytoplankton metabolism.',
    iconName: 'thermometer',
  },
  {
    key: 'TP',
    label: 'Total Phosphorus',
    unit: 'µg/L',
    min: 0.1,
    max: 200,
    step: 0.1,
    defaultValue: 8,
    description: 'Total phosphorus concentration. Primary limiting nutrient for algal growth.',
    iconName: 'droplets',
  },
  {
    key: 'SI',
    label: 'Silica (Si)',
    unit: 'mg/L',
    min: 0,
    max: 5,
    step: 0.01,
    defaultValue: 1.2,
    description: 'Dissolved silica. Essential for diatom cell wall (frustule) construction.',
    iconName: 'flask',
  },
  {
    key: 'NO23',
    label: 'Nitrate + Nitrite',
    unit: 'mg/L',
    min: 0,
    max: 3,
    step: 0.01,
    defaultValue: 0.4,
    description: 'Dissolved inorganic nitrogen. Secondary macronutrient for algal growth.',
    iconName: 'zap',
  },
  {
    key: 'Secchi_m',
    label: 'Secchi Depth',
    unit: 'm',
    min: 0.1,
    max: 40,
    step: 0.1,
    defaultValue: 8,
    description: 'Water clarity depth. Higher values indicate clearer water and deeper light penetration.',
    iconName: 'eye',
  },
  {
    key: 'STN_DEPTH_M',
    label: 'Station Depth',
    unit: 'm',
    min: 1,
    max: 400,
    step: 1,
    defaultValue: 85,
    description: 'Maximum depth at sampling station. Deeper sites tend to be more offshore and oligotrophic.',
    iconName: 'anchor',
  },
  {
    key: 'DOY',
    label: 'Day of Year',
    unit: 'DOY',
    min: 1,
    max: 365,
    step: 1,
    defaultValue: 200,
    description: 'Day of year (1–365). Captures seasonal patterns in phytoplankton dynamics.',
    iconName: 'calendar',
  },
]

// ─── Feature labels for SHAP display ─────────────────────────────────────────
export const FEAT_DISPLAY_LABELS: Record<string, string> = {
  TEMP: 'Temperature',
  TP: 'Total Phosphorus',
  SI: 'Silica',
  NO23: 'Nitrate + Nitrite',
  Secchi_m: 'Secchi Depth',
  STN_DEPTH_M: 'Station Depth',
  DOY_sin: 'Seasonality (sin)',
  DOY_cos: 'Seasonality (cos)',
  NP_ratio: 'N:P Ratio',
}

export const FEAT_SIMPLE_LABELS: Record<string, string> = {
  TEMP: 'Water temperature',
  TP: 'Phosphorus availability',
  SI: 'Silica availability',
  NO23: 'Nitrogen availability',
  Secchi_m: 'Water clarity',
  STN_DEPTH_M: 'Station depth',
  DOY_sin: 'Time of year (cycle)',
  DOY_cos: 'Time of year (phase)',
  NP_ratio: 'Nutrient balance',
}

export const FEAT_UNITS: Record<string, string> = {
  TEMP: '°C',
  TP: 'µg/L',
  SI: 'mg/L',
  NO23: 'mg/L',
  Secchi_m: 'm',
  STN_DEPTH_M: 'm',
  DOY_sin: '',
  DOY_cos: '',
  NP_ratio: '',
}
