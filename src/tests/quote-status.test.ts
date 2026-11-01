import { describe, it, expect } from 'vitest'
import { STATUS_LABELS } from '@/lib/utils'
import type { QuoteStatus } from '@/lib/types'

const ALL_STATUSES: QuoteStatus[] = ['draft', 'sent', 'viewed', 'accepted', 'declined']

describe('STATUS_LABELS', () => {
  it('covers all quote statuses', () => {
    ALL_STATUSES.forEach(status => {
      expect(STATUS_LABELS[status], `Missing status: ${status}`).toBeDefined()
    })
  })

  it('each status has Hebrew label', () => {
    ALL_STATUSES.forEach(status => {
      expect(STATUS_LABELS[status].he).toBeTruthy()
    })
  })

  it('each status has English label', () => {
    ALL_STATUSES.forEach(status => {
      expect(STATUS_LABELS[status].en).toBeTruthy()
    })
  })

  it('each status has a color class', () => {
    ALL_STATUSES.forEach(status => {
      expect(STATUS_LABELS[status].color).toBeTruthy()
    })
  })

  it('accepted is green', () => {
    expect(STATUS_LABELS.accepted.color).toContain('green')
  })

  it('declined is red', () => {
    expect(STATUS_LABELS.declined.color).toContain('red')
  })
})
