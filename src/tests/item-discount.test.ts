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

// ─── 4. Three-way item separation (mirrors page.tsx filter logic) ─────────────

describe('Three-way item separation: one_time / recurring / excluded', () => {
  const items = [
    makeItem({ id: '1', item_type: 'one_time' }),
    makeItem({ id: '2', item_type: 'recurring', recurring_interval: 'monthly' }),
    makeItem({ id: '3', item_type: 'recurring', recurring_interval: 'yearly' }),
    makeItem({ id: '4' }), // item_type defaults to 'one_time'
    makeItem({ id: '5', item_type: 'excluded' }),
    makeItem({ id: '6', item_type: 'excluded' }),
  ]

  const oneTime = items.filter(i => !i.item_type || i.item_type === 'one_time')
  const recurring = items.filter(i => i.item_type === 'recurring')
  const excluded = items.filter(i => i.item_type === 'excluded')

  it('one-time filter picks up items without item_type too, ignores excluded', () => {
    expect(oneTime.map(i => i.id)).toEqual(['1', '4'])
  })

  it('recurring filter picks up only recurring items', () => {
    expect(recurring.map(i => i.id)).toEqual(['2', '3'])
  })

  it('excluded filter picks up only excluded items', () => {
    expect(excluded.map(i => i.id)).toEqual(['5', '6'])
  })

  it('no item appears in more than one group', () => {
    const allGrouped = [...oneTime, ...recurring, ...excluded].map(i => i.id)
    const unique = new Set(allGrouped)
    expect(unique.size).toBe(allGrouped.length)
  })

  it('three groups together cover all items', () => {
    expect(oneTime.length + recurring.length + excluded.length).toBe(items.length)
  })
})

// ─── 5. Excluded items in calcTotal ──────────────────────────────────────────

describe('calcTotal — excluded items contribute nothing', () => {
  it('excluded item does not add to subtotal', () => {
    const items: QuoteItem[] = [
      makeItem({ unit_price: 1000, item_type: 'one_time' }),
      makeItem({ unit_price: 9999, item_type: 'excluded' }),
    ]
    const { subtotal } = calcTotal(items, 0, 0, false, 'percent')
    expect(subtotal).toBe(1000)
  })

  it('excluded item does not add to recurringSubtotal', () => {
    const items: QuoteItem[] = [
      makeItem({ unit_price: 500, item_type: 'recurring', recurring_interval: 'monthly' }),
      makeItem({ unit_price: 9999, item_type: 'excluded' }),
    ]
    const { recurringSubtotal } = calcTotal(items, 0, 0, false, 'percent')
    expect(recurringSubtotal).toBe(500)
  })

  it('all items excluded → subtotal and total are zero', () => {
    const items: QuoteItem[] = [
      makeItem({ unit_price: 5000, item_type: 'excluded' }),
      makeItem({ unit_price: 3000, item_type: 'excluded' }),
    ]
    const { subtotal, total, recurringSubtotal } = calcTotal(items, 0, 18, true, 'percent')
    expect(subtotal).toBe(0)
    expect(total).toBe(0)
    expect(recurringSubtotal).toBe(0)
  })
})
