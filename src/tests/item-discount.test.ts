/**
 * Tests for:
 *   1. itemLineTotal — per-item discount_percent calculation
 *   2. calcSubtotal — correctly sums discounted line totals
 *   3. calcTotal — overall totals with per-item discounts
 *   4. Recurring / one-time item separation
 */
import { describe, it, expect } from 'vitest'
import { itemLineTotal, calcSubtotal, calcTotal } from '@/lib/utils'
import type { QuoteItem } from '@/lib/types'

function makeItem(overrides: Partial<QuoteItem> = {}): QuoteItem {
  return {
    id: '1',
    quote_id: 'q1',
    service_id: null,
    name: 'פריט',
    description: null,
    quantity: 1,
    unit_price: 1000,
    sort_order: 0,
    item_type: 'one_time',
    recurring_interval: null,
    discount_percent: 0,
    ...overrides,
  }
}

// ─── 1. itemLineTotal ─────────────────────────────────────────────────────────

describe('itemLineTotal', () => {
  it('no discount — returns quantity × unit_price', () => {
    expect(itemLineTotal(makeItem({ quantity: 3, unit_price: 500, discount_percent: 0 }))).toBe(1500)
  })

  it('50% discount halves the line total', () => {
    expect(itemLineTotal(makeItem({ quantity: 1, unit_price: 4500, discount_percent: 50 }))).toBe(2250)
  })

  it('100% discount makes the line total zero (free item)', () => {
    expect(itemLineTotal(makeItem({ quantity: 1, unit_price: 4500, discount_percent: 100 }))).toBe(0)
  })

  it('discount_percent undefined defaults to no discount', () => {
    const item = makeItem({ unit_price: 1000 })
    delete (item as any).discount_percent
    expect(itemLineTotal(item)).toBe(1000)
  })

  it('quantity × unit_price × (1 - dp/100)', () => {
    expect(itemLineTotal(makeItem({ quantity: 2, unit_price: 300, discount_percent: 10 }))).toBeCloseTo(540)
  })
})

// ─── 2. calcSubtotal ──────────────────────────────────────────────────────────

describe('calcSubtotal', () => {
  it('sums line totals applying per-item discounts', () => {
    const items: QuoteItem[] = [
      makeItem({ quantity: 1, unit_price: 1000, discount_percent: 0 }),
      makeItem({ quantity: 1, unit_price: 2000, discount_percent: 50 }),  // 1000
    ]
    expect(calcSubtotal(items)).toBe(2000)
  })

  it('free item does not contribute to subtotal', () => {
    const items: QuoteItem[] = [
      makeItem({ unit_price: 500, discount_percent: 0 }),
      makeItem({ unit_price: 500, discount_percent: 100 }),
    ]
    expect(calcSubtotal(items)).toBe(500)
  })
})

// ─── 3. calcTotal with per-item discounts ─────────────────────────────────────

describe('calcTotal with per-item discounts', () => {
  it('quote-level discount applies after per-item discounts', () => {
    // item subtotal = 500 (1000 with 50% off)
    // then 10% quote discount → 450
    const items: QuoteItem[] = [makeItem({ unit_price: 1000, discount_percent: 50 })]
    const { subtotal, discountAmount, total } = calcTotal(items, 10, 0, false, 'percent')
    expect(subtotal).toBe(500)
    expect(discountAmount).toBe(50)
    expect(total).toBe(450)
  })

  it('recurring items excluded from one-time subtotal', () => {
    const items: QuoteItem[] = [
      makeItem({ unit_price: 1000, item_type: 'one_time' }),
      makeItem({ unit_price: 500, item_type: 'recurring', recurring_interval: 'monthly' }),
    ]
    const { subtotal, recurringSubtotal } = calcTotal(items, 0, 0, false, 'percent')
    expect(subtotal).toBe(1000)
    expect(recurringSubtotal).toBe(500)
  })
})

// ─── 4. One-time / recurring separation (mirrors page.tsx filter logic) ───────

describe('One-time vs recurring item separation', () => {
  const items = [
    makeItem({ id: '1', item_type: 'one_time' }),
    makeItem({ id: '2', item_type: 'recurring', recurring_interval: 'monthly' }),
    makeItem({ id: '3', item_type: 'recurring', recurring_interval: 'yearly' }),
    makeItem({ id: '4' }), // item_type defaults to 'one_time'
  ]

  const oneTime = items.filter(i => !i.item_type || i.item_type === 'one_time')
  const recurring = items.filter(i => i.item_type === 'recurring')

  it('one-time filter picks up items without item_type too', () => {
    expect(oneTime.map(i => i.id)).toEqual(['1', '4'])
  })

  it('recurring filter picks up only recurring items', () => {
    expect(recurring.map(i => i.id)).toEqual(['2', '3'])
  })

  it('no overlap between the two groups', () => {
    const oneTimeIds = new Set(oneTime.map(i => i.id))
    const recurringIds = new Set(recurring.map(i => i.id))
    const overlap = [...oneTimeIds].filter(id => recurringIds.has(id))
    expect(overlap).toHaveLength(0)
  })

  it('union covers all items', () => {
    expect(oneTime.length + recurring.length).toBe(items.length)
  })
})
