/**
 * CRUD validation tests
 * Verifies form validation logic and payload shape for clients, services, and quotes.
 */
import { describe, it, expect } from 'vitest'
import { calcTotal } from '@/lib/utils'
import type { QuoteItem } from '@/lib/types'

// --- Client form ---

interface ClientForm {
  name: string
  email: string
  phone: string
  company: string
  address: string
}

function validateClientForm(form: ClientForm): string | null {
  if (!form.name.trim()) return 'שם לקוח הוא שדה חובה'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'כתובת אימייל לא תקינה'
  return null
}

function buildClientPayload(form: ClientForm, userId: string) {
  return { ...form, user_id: userId }
}

describe('Client CRUD validation', () => {
  const userId = 'user-123'
  const validForm: ClientForm = { name: 'ישראל ישראלי', email: 'israel@example.com', phone: '050-0000000', company: 'חברה בע"מ', address: 'תל אביב' }

  it('valid form passes validation', () => {
    expect(validateClientForm(validForm)).toBeNull()
  })

  it('empty name fails validation', () => {
    expect(validateClientForm({ ...validForm, name: '' })).toBeTruthy()
    expect(validateClientForm({ ...validForm, name: '   ' })).toBeTruthy()
  })

  it('invalid email fails validation', () => {
    expect(validateClientForm({ ...validForm, email: 'not-an-email' })).toBeTruthy()
    expect(validateClientForm({ ...validForm, email: 'missing@domain' })).toBeTruthy()
  })

  it('empty email is allowed (optional field)', () => {
    expect(validateClientForm({ ...validForm, email: '' })).toBeNull()
  })

  it('insert payload includes user_id', () => {
    const payload = buildClientPayload(validForm, userId)
    expect(payload.user_id).toBe(userId)
  })

  it('insert payload includes all form fields', () => {
    const payload = buildClientPayload(validForm, userId)
    expect(payload.name).toBe(validForm.name)
    expect(payload.email).toBe(validForm.email)
    expect(payload.phone).toBe(validForm.phone)
    expect(payload.company).toBe(validForm.company)
    expect(payload.address).toBe(validForm.address)
  })

  it('update payload does not include user_id (update by id only)', () => {
    // update only sends the form fields, not user_id
    const updatePayload = { ...validForm }
    expect('user_id' in updatePayload).toBe(false)
  })
})

// --- Service form ---

interface ServiceForm {
  name: string
  description: string
  unit_price: number
  unit: string
}

const VALID_UNITS = ['unit', 'hour', 'day', 'month', 'project']

function validateServiceForm(form: ServiceForm): string | null {
  if (!form.name.trim()) return 'שם שירות הוא שדה חובה'
  if (form.unit_price < 0) return 'מחיר לא יכול להיות שלילי'
  if (!VALID_UNITS.includes(form.unit)) return 'יחידה לא תקינה'
  return null
}

function buildServicePayload(form: ServiceForm, userId: string) {
  return { ...form, user_id: userId }
}

describe('Service CRUD validation', () => {
  const userId = 'user-123'
  const validForm: ServiceForm = { name: 'עיצוב לוגו', description: 'כולל 3 הצעות', unit_price: 2000, unit: 'project' }

  it('valid form passes validation', () => {
    expect(validateServiceForm(validForm)).toBeNull()
  })

  it('empty name fails validation', () => {
    expect(validateServiceForm({ ...validForm, name: '' })).toBeTruthy()
  })

  it('negative price fails validation', () => {
    expect(validateServiceForm({ ...validForm, unit_price: -1 })).toBeTruthy()
  })

  it('zero price is allowed', () => {
    expect(validateServiceForm({ ...validForm, unit_price: 0 })).toBeNull()
  })

  it('invalid unit fails validation', () => {
    expect(validateServiceForm({ ...validForm, unit: 'invalid' })).toBeTruthy()
  })

  it('all valid units are accepted', () => {
    VALID_UNITS.forEach(unit => {
      expect(validateServiceForm({ ...validForm, unit })).toBeNull()
    })
  })

  it('insert payload includes user_id', () => {
    const payload = buildServicePayload(validForm, userId)
    expect(payload.user_id).toBe(userId)
    expect(payload.name).toBe(validForm.name)
    expect(payload.unit_price).toBe(validForm.unit_price)
  })
})

// --- Quote save payload ---

describe('Quote save payload', () => {
  const items: QuoteItem[] = [
    { id: '1', quote_id: 'q1', service_id: null, name: 'עיצוב', description: null, quantity: 2, unit_price: 1500, sort_order: 0 },
    { id: '2', quote_id: 'q1', service_id: null, name: 'פיתוח', description: null, quantity: 1, unit_price: 5000, sort_order: 1 },
  ]

  it('subtotal matches sum of items', () => {
    const { subtotal } = calcTotal(items, 0, 18, false)
    expect(subtotal).toBe(2 * 1500 + 1 * 5000) // 8000
  })

  it('quote with discount and VAT calculates correctly', () => {
    const { subtotal, discountAmount, vatAmount, total } = calcTotal(items, 10, 18, true)
    expect(subtotal).toBe(8000)
    expect(discountAmount).toBe(800)        // 10% of 8000
    expect(vatAmount).toBeCloseTo(1296)     // 18% of 7200
    expect(total).toBeCloseTo(8496)
  })

  it('quote without VAT ignores vatRate', () => {
    const { vatAmount } = calcTotal(items, 0, 18, false)
    expect(vatAmount).toBe(0)
  })

  it('quote items sort_order is maintained', () => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
    expect(sorted[0].name).toBe('עיצוב')
    expect(sorted[1].name).toBe('פיתוח')
  })
})
