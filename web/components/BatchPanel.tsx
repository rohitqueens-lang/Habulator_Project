'use client'

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { Upload, X, Download, AlertCircle, CheckCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import { batchPredict, ApiError } from '@/lib/api'
import type { BatchInputRow, BatchResultRow } from '@/lib/types'

const REQUIRED = ['TEMP', 'TP', 'SI', 'NO23', 'Secchi_m', 'STN_DEPTH_M', 'DOY'] as const

interface BatchPanelProps {
  activeGroup: string
}

async function parseFile(file: File): Promise<{ rows: BatchInputRow[]; missing: string[]; extra: string[] }> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]

  if (raw.length === 0) throw new Error('File is empty')

  const cols = Object.keys(raw[0])
  const missing = REQUIRED.filter((r) => !cols.includes(r))
  const extra = cols.filter((c) => !(REQUIRED as readonly string[]).includes(c))

  const rows: BatchInputRow[] = raw.map((r) => {
    const row: Record<string, number | string> = {}
    for (const col of cols) {
      if ((REQUIRED as readonly string[]).includes(col)) {
        row[col] = parseFloat(String(r[col]))
      } else {
        row[col] = String(r[col])
      }
    }
    return row as BatchInputRow
  })

  return { rows, missing, extra }
}

function downloadResults(results: BatchResultRow[], group: string) {
  const ws = XLSX.utils.json_to_sheet(
    results.map((r) => ({
      Row: r._row,
      TEMP: r.TEMP,
      TP: r.TP,
      SI: r.SI,
      NO23: r.NO23,
      Secchi_m: r.Secchi_m,
      STN_DEPTH_M: r.STN_DEPTH_M,
      DOY: r.DOY,
      [`${group}_Low_mgL`]: r.low_mgL,
      [`${group}_Pred_mgL`]: r.pred_mgL,
      [`${group}_High_mgL`]: r.high_mgL,
      [`${group}_Bloom_Level`]: r.bloom_level,
      Error: r.error ?? '',
    }))
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Predictions')
  XLSX.writeFile(wb, `habulator_${group.toLowerCase()}_predictions.xlsx`)
}

function bloomColor(level: string): string {
  switch (level) {
    case 'Low':
      return '#16a34a'
    case 'Moderate':
      return '#d97706'
    case 'Elevated':
      return '#ea580c'
    case 'High':
      return '#dc2626'
    default:
      return '#6b7280'
  }
}

export default function BatchPanel({ activeGroup }: BatchPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [rawRows, setRawRows] = useState<BatchInputRow[]>([])
  const [extraCols, setExtraCols] = useState<string[]>([])
  const [missingCols, setMissingCols] = useState<string[]>([])
  const [results, setResults] = useState<BatchResultRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (f: File) => {
    setParseError(null)
    setResults(null)
    setError(null)
    setFile(f)
    setRawRows([])
    setMissingCols([])
    setExtraCols([])

    try {
      const { rows, missing, extra } = await parseFile(f)
      if (rows.length > 5000) {
        setParseError('File exceeds 5,000 rows. Please split it into smaller batches.')
        return
      }
      setRawRows(rows)
      setMissingCols(missing)
      setExtraCols(extra)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) processFile(f)
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) processFile(f)
      // reset so re-uploading same file triggers onChange
      e.target.value = ''
    },
    [processFile]
  )

  const handleRemove = useCallback(() => {
    setFile(null)
    setRawRows([])
    setExtraCols([])
    setMissingCols([])
    setResults(null)
    setError(null)
    setParseError(null)
  }, [])

  const handleRunBatch = useCallback(async () => {
    if (rawRows.length === 0 || missingCols.length > 0) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const resp = await batchPredict(activeGroup, rawRows)
      setResults(resp.results)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }, [activeGroup, rawRows, missingCols])

  const nSuccess = results ? results.filter((r) => !r.error).length : 0
  const nError = results ? results.filter((r) => !!r.error).length : 0

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: '#0f172a',
      }}
    >
      {/* Drop zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? '2px solid #06b6d4' : '2px dashed #cbd5e1',
            borderRadius: 12,
            background: dragOver ? 'rgba(6,182,212,0.05)' : '#f8fafc',
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(6,182,212,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={24} color="#06b6d4" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: 15, color: '#1e293b', margin: 0 }}>
              Drag &amp; drop your file here, or click to browse
            </p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Supported: .xlsx, .xls, .csv &nbsp;·&nbsp; Max 5,000 rows
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* File info bar */}
      {file && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f1f5f9',
            borderRadius: 10,
            padding: '10px 14px',
            border: '1px solid #e2e8f0',
          }}
        >
          <FileSpreadsheet size={18} color="#06b6d4" />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', flex: 1 }}>
            {file.name}
          </span>
          {rawRows.length > 0 && (
            <span style={{ fontSize: 13, color: '#64748b' }}>{rawRows.length} rows</span>
          )}
          <button
            onClick={handleRemove}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              color: '#94a3b8',
            }}
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 14, color: '#b91c1c' }}>{parseError}</span>
        </div>
      )}

      {/* Missing columns error */}
      {missingCols.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 14, color: '#b91c1c' }}>
            Missing required columns: <strong>{missingCols.join(', ')}</strong>
          </span>
        </div>
      )}

      {/* Columns OK — show success + extra cols */}
      {file && rawRows.length > 0 && missingCols.length === 0 && !parseError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '10px 14px',
          }}
        >
          <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>
            {rawRows.length} rows ready
          </span>
          {extraCols.length > 0 && (
            <span style={{ fontSize: 13, color: '#4ade80', marginLeft: 4 }}>
              · Extra columns kept: {extraCols.join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Preview table */}
      {rawRows.length > 0 && missingCols.length === 0 && !parseError && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
            Preview (first 5 rows)
          </p>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {REQUIRED.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: '#475569',
                        borderBottom: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 5).map((row, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                  >
                    {REQUIRED.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: '7px 12px',
                          textAlign: 'right',
                          color: '#1e293b',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        {typeof row[col] === 'number' ? (row[col] as number).toFixed(2) : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Run button */}
      {rawRows.length > 0 && !parseError && (
        <button
          onClick={handleRunBatch}
          disabled={loading || missingCols.length > 0}
          style={{
            background: loading || missingCols.length > 0 ? '#e2e8f0' : '#06b6d4',
            color: loading || missingCols.length > 0 ? '#94a3b8' : '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading || missingCols.length > 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.15s ease',
            width: '100%',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Processing {rawRows.length} rows...
            </>
          ) : (
            'Run Batch Prediction →'
          )}
        </button>
      )}

      {/* API error */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 14, color: '#b91c1c' }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '6px 12px',
              }}
            >
              <CheckCircle size={14} color="#16a34a" />
              <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
                {nSuccess} predictions complete
              </span>
            </div>
            {nError > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '6px 12px',
                }}
              >
                <AlertCircle size={14} color="#ef4444" />
                <span style={{ fontSize: 13, color: '#b91c1c', fontWeight: 500 }}>
                  {nError} rows had errors
                </span>
              </div>
            )}
          </div>

          {/* Results table */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: 400,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#f8fafc' }}>
                  {['Row', 'TEMP', 'TP', 'Low', 'Best', 'High', 'Bloom Level'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: '#475569',
                        borderBottom: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const isError = !!r.error
                  return (
                    <tr
                      key={r._row}
                      style={{
                        background: isError
                          ? '#fff5f5'
                          : i % 2 === 0
                          ? '#ffffff'
                          : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                        {r._row}
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                        {r.TEMP}
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                        {r.TP}
                      </td>
                      {isError ? (
                        <td
                          colSpan={4}
                          style={{
                            padding: '7px 12px',
                            textAlign: 'left',
                            color: '#ef4444',
                            fontSize: 12,
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          {r.error}
                        </td>
                      ) : (
                        <>
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                            {r.low_mgL.toFixed(4)}
                          </td>
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                            {r.pred_mgL.toFixed(4)}
                          </td>
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                            {r.high_mgL.toFixed(4)}
                          </td>
                          <td style={{ padding: '7px 12px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>
                            <span
                              style={{
                                color: bloomColor(r.bloom_level),
                                fontWeight: 600,
                              }}
                            >
                              {r.bloom_level}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Download button */}
          <button
            onClick={() => downloadResults(results, activeGroup)}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s ease',
              width: '100%',
            }}
          >
            <Download size={16} />
            Download Results as Excel
          </button>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
