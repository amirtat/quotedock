/**
 * Tests for features added in batch:
 *   1. app_config: quote_number_prefix + default_quote_validity_days
 *   2. Fixed amount discount + discount_reason
 *   3. Quote duplication logic
 *   4. PDF print (no runtime logic to test — covered by CSS presence)
 */
import { describe, it, expect } from 'vitest'
import { calcTotal, intervalLabel } from '@/lib/utils'
import type { QuoteItem, QuoteStatus } from '@/lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeItem(qty: number, price: number, i = 0): QuoteItem {
  return { id: String(i), quote_id: 'q1', service_id: null, name: 'פריט', description: null, quantity: qty, unit_price: price, sort_order: i, item_type: 'one_time', recurring_interval: null }
}

// Mirrors the prefix + count + year logic in new/page.tsx and duplicate action
function buildQuoteNumber(prefix: string, count: number, year = 2025): string {
  return `${prefix}-${year}-${String(count).padStart(3, '0')}`
}

// Mirrors the defaultValidUntil logic in new/page.tsx
function calcDefaultValidUntil(validityDays: number, from = new Date('2025-01-01')): string {
  const d = new Date(from)
  d.setDate(d.getDate() + validityDays)
  return d.toISOString().split('T')[0]
}

// Mirrors the discount row label logic in preview/page.tsx and q/[token]/page.tsx
function discountLabel(discountType: 'percent' | 'fixed', discount: number, reason?: string | null): string {
  const base = reason ? `הנחה — ${reason}` : 'הנחה'
  const suffix = discountType !== 'fixed' ? ` (${discount}%)` : ''
  return `${base}${suffix}`
}

// Mirrors the duplicate server action (without Supabase I/O)
interface MockQuote {
  id: string
  title: string
  status: QuoteStatus
  client_id: string | null
  notes: string | null
  valid_until: string | null
  discount: number
  discount_type: 'percent' | 'fixed'
  discount_reason: string | null
  include_vat: boolean
  items: QuoteItem[]
}

function duplicateQuote(original: MockQuote, newId: string, nextNumber: string): { quote: Omit<MockQuote, 'id'> & { id: string; number: string }; items: QuoteItem[] } {
  return {
    quote: {
      id: newId,
      number: nextNumber,
      title: `${original.title} (עותק)`,
      status: 'draft',
      client_id: original.client_id,
      notes: original.notes,
      valid_until: original.valid_until,
      discount: original.discount,
      discount_type: original.discount_type,
      discount_reason: original.discount_reason,
      include_vat: original.include_vat,
      items: [],
    },
    items: original.items.map((item) => ({ ...item, id: `new-${item.id}`, quote_id: newId })),
  }
}

// ─── 1. Quote number prefix ──────────────────────────────────────────────────

describe('Quote number prefix (app_config)', () => {
  it('generates correct number with default QD prefix', () => {
    expect(buildQuoteNumber('QD', 1, 2025)).toBe('QD-2025-001')
    expect(buildQuoteNumber('QD', 12, 2025)).toBe('QD-2025-012')
    expect(buildQuoteNumber('QD', 100, 2025)).toBe('QD-2025-100')
  })

  it('generates correct number with custom prefix', () => {
    expect(buildQuoteNumber('ABC', 5, 2025)).toBe('ABC-2025-005')
    expect(buildQuoteNumber('MY', 1, 2026)).toBe('MY-2026-001')
  })

  it('pads count to 3 digits', () => {
    expect(buildQuoteNumber('QD', 1, 2025)).toContain('-001')
    expect(buildQuoteNumber('QD', 9, 2025)).toContain('-009')
    expect(buildQuoteNumber('QD', 99, 2025)).toContain('-099')
    expect(buildQuoteNumber('QD', 999, 2025)).toContain('-999')
  })

  it('count beyond 999 is not truncated', () => {
    // padStart(3) does not truncate — 1000 stays as 1000
    expect(buildQuoteNumber('QD', 1000, 2025)).toBe('QD-2025-1000')
  })
})

// ─── 2. Default validity date ────────────────────────────────────────────────

describe('Default valid_until (app_config)', () => {
  it('30 days from Jan 1 = Jan 31', () => {
    expect(calcDefaultValidUntil(30, new Date('2025-01-01'))).toBe('2025-01-31')
  })

  it('7 days from Jan 1 = Jan 8', () => {
    expect(calcDefaultValidUntil(7, new Date('2025-01-01'))).toBe('2025-01-08')
  })

  it('handles month boundary correctly', () => {
    expect(calcDefaultValidUntil(30, new Date('2025-01-15'))).toBe('2025-02-14')
  })

  it('handles year boundary correctly', () => {
    expect(calcDefaultValidUntil(10, new Date('2024-12-25'))).toBe('2025-01-04')
  })

  it('produces ISO date string (YYYY-MM-DD)', () => {
    const result = calcDefaultValidUntil(30)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ─── 3. Fixed amount discount ────────────────────────────────────────────────

describe('Fixed amount discount', () => {
  const items = [makeItem(1, 1000)]

  it('fixed: deducts exact amount', () => {
    const { discountAmount, total } = calcTotal(items, 200, 18, false, 'fixed')
    expect(discountAmount).toBe(200)
    expect(total).toBe(800)
  })

  it('fixed: capped at subtotal (never goes negative)', () => {
    const { discountAmount, total } = calcTotal(items, 1500, 18, false, 'fixed')
    expect(discountAmount).toBe(1000)
    expect(total).toBe(0)
  })

  it('fixed: VAT is applied on amount after discount', () => {
    const { discountAmount, vatAmount, total } = calcTotal(items, 200, 18, true, 'fixed')
    expect(discountAmount).toBe(200)
    expect(vatAmount).toBeCloseTo(144)   // 18% of 800
    expect(total).toBeCloseTo(944)
  })

  it('percent discount is unaffected by discountType default', () => {
    const result = calcTotal(items, 10, 18, false)          // no 5th arg → percent
    const explicit = calcTotal(items, 10, 18, false, 'percent')
    expect(result.discountAmount).toBe(explicit.discountAmount)
    expect(result.total).toBe(explicit.total)
  })

  it('zero discount produces no discountAmount regardless of type', () => {
    expect(calcTotal(items, 0, 18, false, 'fixed').discountAmount).toBe(0)
    expect(calcTotal(items, 0, 18, false, 'percent').discountAmount).toBe(0)
  })
})

// ─── 4. Discount label (display) ─────────────────────────────────────────────

describe('Discount label display', () => {
  it('percent discount shows percentage', () => {
    expect(discountLabel('percent', 10)).toBe('הנחה (10%)')
  })

  it('fixed discount shows no percentage', () => {
    expect(discountLabel('fixed', 200)).toBe('הנחה')
  })

  it('reason is prepended to label', () => {
    expect(discountLabel('percent', 10, 'לקוח קבוע')).toBe('הנחה — לקוח קבוע (10%)')
  })

  it('reason on fixed discount — no percentage suffix', () => {
    expect(discountLabel('fixed', 200, 'הנחת אחים')).toBe('הנחה — הנחת אחים')
  })

  it('null reason is treated as no reason', () => {
    expect(discountLabel('percent', 15, null)).toBe('הנחה (15%)')
  })
})

// ─── 5. Quote duplication logic ──────────────────────────────────────────────

describe('Quote duplication', () => {
  const original: MockQuote = {
    id: 'orig-1',
    title: 'הצעה ללקוח A',
    status: 'accepted',
    client_id: 'client-1',
    notes: 'בתוקף עד סוף חודש',
    valid_until: '2025-03-31',
    discount: 10,
    discount_type: 'percent',
    discount_reason: 'לקוח קבוע',
    include_vat: true,
    items: [
      makeItem(2, 500, 0),
      makeItem(1, 1500, 1),
    ],
  }

  const { quote: dup, items: dupItems } = duplicateQuote(original, 'dup-1', 'QD-2025-005')

  it('duplicate title appends (עותק)', () => {
    expect(dup.title).toBe('הצעה ללקוח A (עותק)')
  })

  it('duplicate status is always draft', () => {
    expect(dup.status).toBe('draft')
  })

  it('duplicate gets new id and number', () => {
    expect(dup.id).toBe('dup-1')
    expect(dup.number).toBe('QD-2025-005')
  })

  it('copies client, notes, valid_until', () => {
    expect(dup.client_id).toBe(original.client_id)
    expect(dup.notes).toBe(original.notes)
    expect(dup.valid_until).toBe(original.valid_until)
  })

  it('copies discount fields', () => {
    expect(dup.discount).toBe(original.discount)
    expect(dup.discount_type).toBe(original.discount_type)
    expect(dup.discount_reason).toBe(original.discount_reason)
  })

  it('copies include_vat', () => {
    expect(dup.include_vat).toBe(original.include_vat)
  })

  it('items are duplicated with new quote_id', () => {
    expect(dupItems).toHaveLength(2)
    expect(dupItems.every(i => i.quote_id === 'dup-1')).toBe(true)
  })

  it('item content is preserved', () => {
    expect(dupItems[0].quantity).toBe(2)
    expect(dupItems[0].unit_price).toBe(500)
    expect(dupItems[1].unit_price).toBe(1500)
  })

  it('item sort_order is preserved', () => {
    expect(dupItems[0].sort_order).toBe(0)
    expect(dupItems[1].sort_order).toBe(1)
  })

  it('duplicating accepted/declined quote resets to draft', () => {
    const declined: MockQuote = { ...original, status: 'declined' }
    const { quote } = duplicateQuote(declined, 'dup-2', 'QD-2025-006')
    expect(quote.status).toBe('draft')
  })
})
