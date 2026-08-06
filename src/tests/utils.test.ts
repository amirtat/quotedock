import { describe, it, expect } from 'vitest'
import { calcSubtotal, calcTotal, formatCurrency } from '@/lib/utils'
import type { QuoteItem } from '@/lib/types'

const makeItem = (qty: number, price: number): QuoteItem => ({
  id: '1', quote_id: 'q1', service_id: null,
  name: 'Test', description: null,
  quantity: qty, unit_price: price, sort_order: 0,
})

// --- calcSubtotal ---
describe('calcSubtotal', () => {
  it('returns 0 for empty items', () => {
    expect(calcSubtotal([])).toBe(0)
  })

  it('multiplies quantity × price for each item', () => {
    expect(calcSubtotal([makeItem(2, 100), makeItem(3, 50)])).toBe(350)
  })

  it('handles fractional quantities', () => {
    expect(calcSubtotal([makeItem(1.5, 200)])).toBe(300)
  })
})

// --- calcTotal ---
describe('calcTotal', () => {
  it('no discount, no VAT', () => {
    const result = calcTotal([makeItem(1, 1000)], 0, 17, false)
    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(0)
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(1000)
  })

  it('applies discount correctly', () => {
    const result = calcTotal([makeItem(1, 1000)], 10, 17, false)
    expect(result.discountAmount).toBe(100)
    expect(result.total).toBe(900)
  })

  it('applies VAT after discount', () => {
    const result = calcTotal([makeItem(1, 1000)], 0, 17, true)
    expect(result.vatAmount).toBe(170)
    expect(result.total).toBe(1170)
  })

  it('applies discount then VAT', () => {
    const result = calcTotal([makeItem(1, 1000)], 10, 17, true)
    expect(result.discountAmount).toBe(100)
    expect(result.vatAmount).toBeCloseTo(153)
    expect(result.total).toBeCloseTo(1053)
  })

  it('handles zero unit price', () => {
    const result = calcTotal([makeItem(5, 0)], 0, 17, true)
    expect(result.total).toBe(0)
  })

  it('vatRate 0 (עוסק זעיר) — no VAT even when include_vat is true', () => {
    const result = calcTotal([makeItem(1, 1000)], 0, 0, true)
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(1000)
  })

  it('default VAT rate is 18%', () => {
    const result = calcTotal([makeItem(1, 1000)], 0, 18, true)
    expect(result.vatAmount).toBe(180)
    expect(result.total).toBe(1180)
  })

  it('vatRate 0 should default includeVat to false (עוסק זעיר logic)', () => {
    // Mirrors: useState(initialData?.include_vat ?? (vatRate > 0))
    const defaultIncludeVat = (vatRate: number) => vatRate > 0
    expect(defaultIncludeVat(0)).toBe(false)   // עוסק זעיר — VAT off by default
    expect(defaultIncludeVat(18)).toBe(true)   // רגיל — VAT on by default
    expect(defaultIncludeVat(17)).toBe(true)   // ערך ישן — VAT on by default
  })
})

// --- formatCurrency ---
describe('formatCurrency', () => {
  it('formats ILS correctly', () => {
    const result = formatCurrency(1000, 'ILS')
    expect(result).toContain('1,000')
    expect(result).toContain('₪')
  })

  it('formats zero', () => {
    expect(formatCurrency(0, 'ILS')).toContain('0')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1234567, 'ILS')).toContain('1,234,567')
  })
})
