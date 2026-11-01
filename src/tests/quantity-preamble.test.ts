/**
 * Tests for:
 *   1. show_quantity initialization logic
 *   2. Mobile item display format (unit price vs qty × price)
 *   3. Preamble field behaviour
 */
import { describe, it, expect } from 'vitest'

// ─── Mirrors show_quantity init from quote-builder.tsx ────────────────────────

function resolveShowQuantity(
  quoteShowQuantity: boolean | undefined | null,
  profileDefault: boolean | undefined | null,
): boolean {
  return (quoteShowQuantity ?? profileDefault) ?? false
}

// ─── Mirrors mobile item label from q/[token]/page.tsx ────────────────────────

function mobileItemLabel(
  showQuantity: boolean,
  quantity: number,
  unitPrice: number,
  currency = 'ILS',
): string {
  const fmt = (n: number) => `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (showQuantity && quantity !== 1) return `${quantity} × ${fmt(unitPrice)}`
  return fmt(unitPrice)
}

// ─── Mirrors preamble save logic (null-coalescing empty string) ───────────────

function normalisePreamble(value: string | null | undefined): string | null {
  return value?.trim() || null
}

// ─── 1. show_quantity initialisation ─────────────────────────────────────────

describe('show_quantity - initialisation', () => {
  it('uses false as ultimate fallback when both are absent', () => {
    expect(resolveShowQuantity(undefined, undefined)).toBe(false)
    expect(resolveShowQuantity(null, null)).toBe(false)
    expect(resolveShowQuantity(undefined, null)).toBe(false)
  })

  it('uses profile default when quote has no value', () => {
    expect(resolveShowQuantity(undefined, true)).toBe(true)
    expect(resolveShowQuantity(null, true)).toBe(true)
    expect(resolveShowQuantity(undefined, false)).toBe(false)
  })

  it('quote-level value overrides profile default', () => {
    expect(resolveShowQuantity(true, false)).toBe(true)
    expect(resolveShowQuantity(false, true)).toBe(false)
  })

  it('profile default false keeps quantity hidden for new quotes', () => {
    // New quote: quoteShowQuantity = undefined (column not in initialData)
    expect(resolveShowQuantity(undefined, false)).toBe(false)
  })

  it('existing quote with show_quantity=true shows quantity regardless of profile', () => {
    expect(resolveShowQuantity(true, false)).toBe(true)
  })

  it('existing quote with show_quantity=false hides quantity regardless of profile', () => {
    expect(resolveShowQuantity(false, true)).toBe(false)
  })
})

// ─── 2. Mobile item label ─────────────────────────────────────────────────────

describe('Mobile item label - unit price line', () => {
  it('shows only unit price when show_quantity is false', () => {
    const label = mobileItemLabel(false, 3, 1000)
    expect(label).not.toContain('×')
    expect(label).toContain('1,000')
  })

  it('shows only unit price when quantity is 1 and show_quantity is true', () => {
    const label = mobileItemLabel(true, 1, 5000)
    expect(label).not.toContain('×')
    expect(label).toContain('5,000')
  })

  it('shows qty × price when show_quantity is true and quantity > 1', () => {
    const label = mobileItemLabel(true, 3, 1000)
    expect(label).toContain('3 ×')
    expect(label).toContain('1,000')
  })

  it('never shows qty × price when show_quantity is false, even with qty > 1', () => {
    const label = mobileItemLabel(false, 10, 500)
    expect(label).not.toContain('×')
  })
})

// ─── 3. Preamble normalisation ────────────────────────────────────────────────

describe('Preamble normalisation before save', () => {
  it('stores null for empty string', () => {
    expect(normalisePreamble('')).toBeNull()
    expect(normalisePreamble('   ')).toBeNull()
    expect(normalisePreamble(null)).toBeNull()
    expect(normalisePreamble(undefined)).toBeNull()
  })

  it('stores trimmed text for non-empty input', () => {
    expect(normalisePreamble('הקדמה')).toBe('הקדמה')
    expect(normalisePreamble('  רקע  ')).toBe('רקע')
  })

  it('preserves internal newlines', () => {
    const text = 'שורה 1\nשורה 2'
    expect(normalisePreamble(text)).toBe(text)
  })
})
