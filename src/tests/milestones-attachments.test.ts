/**
 * Tests for:
 *   1. Payment milestones - percent validation, presets, amount calculation
 *   2. Attachments - file type/size validation, size formatting
 */
import { describe, it, expect } from 'vitest'

// ─── Mirrors milestone logic from quote-builder.tsx ──────────────────────────

type MilestoneRow = { title: string; percent: number; due_date: string }

function applyPreset(percents: number[], titles: string[]): MilestoneRow[] {
  return percents.map((p, i) => ({ title: titles[i], percent: p, due_date: '' }))
}

function totalPercent(milestones: MilestoneRow[]): number {
  return milestones.reduce((s, m) => s + m.percent, 0)
}

function milestoneAmount(total: number, percent: number): number {
  return total * percent / 100
}

// ─── Mirrors attachment validation from attachments-manager.tsx ───────────────

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']

function validateFile(type: string, size: number): string | null {
  if (!ALLOWED.includes(type)) return 'קובץ לא נתמך - PDF ותמונות בלבד'
  if (size > MAX_SIZE) return 'קובץ גדול מדי - עד 5MB'
  return null
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ─── Mirrors storage path extraction from attachments-manager.tsx ─────────────

function extractStoragePath(fileUrl: string): string | null {
  const marker = '/quote-attachments/'
  const idx = fileUrl.indexOf(marker)
  return idx !== -1 ? decodeURIComponent(fileUrl.slice(idx + marker.length)) : null
}

// ─── 1. Payment milestones ────────────────────────────────────────────────────

describe('Payment milestones - presets', () => {
  it('50/50 preset produces two rows summing to 100', () => {
    const ms = applyPreset([50, 50], ['מקדמה בחתימה', 'יתרה במסירה'])
    expect(ms).toHaveLength(2)
    expect(totalPercent(ms)).toBe(100)
    expect(ms[0].percent).toBe(50)
    expect(ms[1].percent).toBe(50)
  })

  it('40/30/30 preset produces three rows summing to 100', () => {
    const ms = applyPreset([40, 30, 30], ['מקדמה בחתימה', 'אמצע פרויקט', 'יתרה במסירה'])
    expect(ms).toHaveLength(3)
    expect(totalPercent(ms)).toBe(100)
    expect(ms[0].percent).toBe(40)
  })

  it('preset sets correct titles', () => {
    const ms = applyPreset([50, 50], ['מקדמה בחתימה', 'יתרה במסירה'])
    expect(ms[0].title).toBe('מקדמה בחתימה')
    expect(ms[1].title).toBe('יתרה במסירה')
  })

  it('preset sets empty due_date', () => {
    const ms = applyPreset([50, 50], ['א', 'ב'])
    expect(ms.every(m => m.due_date === '')).toBe(true)
  })
})

describe('Payment milestones - percent validation', () => {
  it('valid: milestones summing to 100 pass', () => {
    expect(totalPercent(applyPreset([50, 50], ['א', 'ב']))).toBe(100)
    expect(totalPercent(applyPreset([40, 30, 30], ['א', 'ב', 'ג']))).toBe(100)
    expect(totalPercent(applyPreset([33, 33, 34], ['א', 'ב', 'ג']))).toBe(100)
  })

  it('invalid: milestones not summing to 100', () => {
    expect(totalPercent(applyPreset([50, 40], ['א', 'ב']))).toBe(90)
    expect(totalPercent(applyPreset([33, 33, 33], ['א', 'ב', 'ג']))).toBe(99)
    expect(totalPercent([])).toBe(0)
  })

  it('empty milestones list sums to 0', () => {
    expect(totalPercent([])).toBe(0)
  })
})

describe('Payment milestones - amount calculation', () => {
  it('calculates correct amount from total and percent', () => {
    expect(milestoneAmount(10000, 50)).toBe(5000)
    expect(milestoneAmount(10000, 40)).toBe(4000)
    expect(milestoneAmount(10000, 30)).toBe(3000)
  })

  it('fractional percent', () => {
    expect(milestoneAmount(1000, 33.5)).toBeCloseTo(335)
  })

  it('100% of total equals total', () => {
    expect(milestoneAmount(8500, 100)).toBe(8500)
  })

  it('0% produces zero', () => {
    expect(milestoneAmount(10000, 0)).toBe(0)
  })
})

// ─── 2. Attachments ───────────────────────────────────────────────────────────

describe('Attachment file validation - type', () => {
  it('allows PDF', () => {
    expect(validateFile('application/pdf', 1000)).toBeNull()
  })

  it('allows common image types', () => {
    expect(validateFile('image/jpeg', 1000)).toBeNull()
    expect(validateFile('image/png', 1000)).toBeNull()
    expect(validateFile('image/gif', 1000)).toBeNull()
    expect(validateFile('image/webp', 1000)).toBeNull()
  })

  it('rejects unsupported types', () => {
    expect(validateFile('application/msword', 1000)).toBeTruthy()
    expect(validateFile('text/plain', 1000)).toBeTruthy()
    expect(validateFile('video/mp4', 1000)).toBeTruthy()
    expect(validateFile('application/zip', 1000)).toBeTruthy()
  })
})

describe('Attachment file validation - size', () => {
  const MB = 1024 * 1024

  it('allows files under 5MB', () => {
    expect(validateFile('application/pdf', 1 * MB)).toBeNull()
    expect(validateFile('application/pdf', 4.9 * MB)).toBeNull()
  })

  it('rejects files over 5MB', () => {
    expect(validateFile('application/pdf', 5 * MB + 1)).toBeTruthy()
    expect(validateFile('image/jpeg', 10 * MB)).toBeTruthy()
  })

  it('allows exactly 5MB (bucket limit)', () => {
    expect(validateFile('application/pdf', 5 * MB)).toBeNull()
  })
})

describe('Attachment size formatting', () => {
  it('formats KB correctly', () => {
    expect(formatSize(512 * 1024)).toBe('512KB')
    expect(formatSize(1024)).toBe('1KB')
  })

  it('formats MB correctly', () => {
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5MB')
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0MB')
  })

  it('returns empty string for null/zero', () => {
    expect(formatSize(null)).toBe('')
    expect(formatSize(0)).toBe('')
  })
})

describe('Attachment storage path extraction', () => {
  const baseUrl = 'https://abc.supabase.co/storage/v1/object/public'

  it('extracts correct path from Supabase public URL', () => {
    const url = `${baseUrl}/quote-attachments/user-1/quote-1/file.pdf`
    expect(extractStoragePath(url)).toBe('user-1/quote-1/file.pdf')
  })

  it('handles URL-encoded filenames', () => {
    const url = `${baseUrl}/quote-attachments/user-1/quote-1/my%20file.pdf`
    expect(extractStoragePath(url)).toBe('user-1/quote-1/my file.pdf')
  })

  it('returns null for unrelated URLs', () => {
    expect(extractStoragePath('https://example.com/file.pdf')).toBeNull()
  })
})
