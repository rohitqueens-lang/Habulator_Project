export interface InputFeatures {
  TEMP: number        // 0–30 °C
  TP: number          // 0.1–200 µg/L
  SI: number          // 0–5 mg/L
  NO23: number        // 0–3 mg/L
  Secchi_m: number    // 0.1–40 m
  STN_DEPTH_M: number // 1–400 m
  DOY: number         // 1–365
}

export interface ShapEntry {
  feature: string
  value: number
  shap: number
}

export interface PredictionResult {
  pred_mgL: number
  lower_mgL: number
  upper_mgL: number
  base_val: number
  shap: ShapEntry[]
  coverage: number
  group: string
}

export type BloomLevel = 'low' | 'moderate' | 'elevated' | 'high'

// Batch prediction types
export interface BatchInputRow {
  TEMP: number
  TP: number
  SI: number
  NO23: number
  Secchi_m: number
  STN_DEPTH_M: number
  DOY: number
  [key: string]: number | string  // allow extra columns (e.g. station ID, date)
}

export interface BatchResultRow {
  _row: number           // original row index (1-based)
  TEMP: number
  TP: number
  SI: number
  NO23: number
  Secchi_m: number
  STN_DEPTH_M: number
  DOY: number
  low_mgL: number
  pred_mgL: number
  high_mgL: number
  bloom_level: string    // "Low" | "Moderate" | "Elevated" | "High"
  error?: string         // if this row failed
}

export interface BatchPredictResponse {
  results: BatchResultRow[]
  n_success: number
  n_error: number
  group: string
}

export interface GroupConfig {
  id: string
  label: string
  fullName: string
  color: string
  available: boolean
}

export interface FeatureConfig {
  key: keyof InputFeatures
  label: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  description: string
  iconName: 'thermometer' | 'droplets' | 'flask' | 'zap' | 'eye' | 'anchor' | 'calendar'
}
