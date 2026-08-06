import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { QuoteItem, QuoteStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'ILS'): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function calcSubtotal(items: QuoteItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
}

export function calcTotal(
  items: QuoteItem[],
  discount: number,
  vatRate: number,
  includeVat: boolean,
  discountType: 'percent' | 'fixed' = 'percent'
): { subtotal: number; discountAmount: number; vatAmount: number; total: number } {
  const subtotal = calcSubtotal(items)
  const discountAmount = discountType === 'fixed'
    ? Math.min(discount, subtotal)
    : subtotal * (discount / 100)
  const afterDiscount = subtotal - discountAmount
  const vatAmount = includeVat ? afterDiscount * (vatRate / 100) : 0
  const total = afterDiscount + vatAmount
  return { subtotal, discountAmount, vatAmount, total }
}

export const FALLBACK_VAT_RATE = 18

export const STATUS_LABELS: Record<QuoteStatus, { he: string; en: string; color: string }> = {
  draft: { he: 'טיוטה', en: 'Draft', color: 'bg-gray-100 text-gray-700' },
  sent: { he: 'נשלח', en: 'Sent', color: 'bg-blue-100 text-blue-700' },
  viewed: { he: 'נצפה', en: 'Viewed', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { he: 'אושר', en: 'Accepted', color: 'bg-green-100 text-green-700' },
  declined: { he: 'נדחה', en: 'Declined', color: 'bg-red-100 text-red-700' },
}
