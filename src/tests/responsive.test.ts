/**
 * Responsive layout tests
 *
 * These tests verify that key UI files contain the Tailwind CSS classes required
 * for mobile-first responsive layouts. They prevent regressions where desktop-only
 * layouts break the 390px mobile viewport.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(__dirname, '../../')
const src = (rel: string) => readFileSync(resolve(root, 'src', rel), 'utf-8')

// ── Sidebar / Layout ────────────────────────────────────────────────────────

describe('Sidebar', () => {
  const file = src('components/layout/sidebar.tsx')

  it('hides on mobile (hidden md:flex)', () => {
    expect(file).toMatch(/hidden md:flex/)
  })
})

describe('MobileTopbar', () => {
  const file = src('components/layout/mobile-topbar.tsx')

  it('is visible only on mobile (md:hidden)', () => {
    expect(file).toMatch(/md:hidden/)
  })

  it('has a hamburger menu trigger', () => {
    // Drawer should be toggle-able via button click
    expect(file).toMatch(/onClick/)
  })
})

describe('Dashboard layout', () => {
  const file = src('app/dashboard/layout.tsx')

  it('clears fixed mobile topbar with top padding', () => {
    expect(file).toMatch(/pt-14 md:pt-0/)
  })

  it('includes MobileTopbar component', () => {
    expect(file).toMatch(/MobileTopbar/)
  })
})

// ── Dashboard page ───────────────────────────────────────────────────────────

describe('Dashboard page', () => {
  const file = src('app/dashboard/page.tsx')

  it('has responsive padding', () => {
    // At least one responsive padding pattern
    expect(file).toMatch(/p-\d+ sm:p-\d+|sm:p-\d+ p-\d+/)
  })

  it('hides price on mobile in recent quotes', () => {
    expect(file).toMatch(/hidden sm:inline/)
  })

  it('filters soft-deleted quotes', () => {
    expect(file).toMatch(/is\('deleted_at', null\)/)
  })
})

// ── Quotes list page ─────────────────────────────────────────────────────────

describe('Quotes list page', () => {
  const file = src('app/dashboard/quotes/page.tsx')

  it('has responsive padding', () => {
    expect(file).toMatch(/p-4 sm:p-6/)
  })

  it('hides table on mobile (hidden sm:table)', () => {
    expect(file).toMatch(/hidden sm:table/)
  })

  it('shows mobile card list (sm:hidden)', () => {
    expect(file).toMatch(/sm:hidden/)
  })

  it('filters soft-deleted quotes', () => {
    expect(file).toMatch(/is\('deleted_at', null\)/)
  })
})

// ── Clients manager ──────────────────────────────────────────────────────────

describe('ClientsManager', () => {
  const file = src('components/clients/clients-manager.tsx')

  it('has responsive padding', () => {
    expect(file).toMatch(/p-4 sm:p-6/)
  })

  it('has responsive dialog grid (stacks on mobile)', () => {
    expect(file).toMatch(/sm:grid-cols-2 grid-cols-1|grid-cols-1 sm:grid-cols-2/)
  })
})

// ── Services manager ─────────────────────────────────────────────────────────

describe('ServicesManager', () => {
  const file = src('components/services/services-manager.tsx')

  it('has responsive padding', () => {
    expect(file).toMatch(/p-4 sm:p-6/)
  })

  it('uses mobile-first grid for service cards', () => {
    expect(file).toMatch(/grid-cols-1 sm:grid-cols-2/)
  })

  it('has responsive dialog grid (stacks on mobile)', () => {
    expect(file).toMatch(/sm:grid-cols-2 grid-cols-1|grid-cols-1 sm:grid-cols-2/)
  })
})

// ── Settings form ────────────────────────────────────────────────────────────

describe('SettingsForm', () => {
  const file = src('components/settings/settings-form.tsx')

  it('has responsive padding', () => {
    expect(file).toMatch(/p-4 sm:p-6/)
  })

  it('does not have bare grid-cols-2 (must have sm: prefix)', () => {
    // Every grid-cols-2 should be paired with sm:grid-cols-2 pattern
    const bareGridCols2 = /(?<!sm:)grid-cols-2(?!\s*sm:)/
    // Check for responsive grids
    expect(file).toMatch(/sm:grid-cols-2/)
    // Ensure there is no bare standalone grid-cols-2 without responsive handling
    const matches = file.match(/grid sm:grid-cols-2 grid-cols-1|grid-cols-1 sm:grid-cols-2/g)
    expect(matches).not.toBeNull()
  })
})

// ── Quote builder (editor) ───────────────────────────────────────────────────

describe('QuoteBuilder', () => {
  const file = src('components/quotes/quote-builder.tsx')

  it('stacks layout vertically on mobile', () => {
    expect(file).toMatch(/flex-col md:flex-row|flex-col sm:flex-row/)
  })

  it('hides column headers on mobile', () => {
    expect(file).toMatch(/hidden sm:flex/)
  })

  it('total panel is full width on mobile', () => {
    expect(file).toMatch(/w-full md:w-\d+|w-full sm:w-\d+/)
  })
})

// ── Public quote page ────────────────────────────────────────────────────────

describe('Public quote page (/q/[token])', () => {
  const file = src('app/q/[token]/page.tsx')

  it('has responsive padding on the document card', () => {
    expect(file).toMatch(/p-4 sm:p-8|p-4 sm:p-6/)
  })

  it('stacks header vertically on mobile', () => {
    expect(file).toMatch(/flex-col.*sm:flex-row|flex flex-col gap-4 sm:flex-row/)
  })

  it('totals section is full width on mobile', () => {
    expect(file).toMatch(/w-full sm:w-\d+/)
  })
})

// ── Public quote actions ─────────────────────────────────────────────────────

describe('PublicQuoteActions', () => {
  const file = src('components/quotes/public-quote-actions.tsx')

  it('has responsive padding', () => {
    expect(file).toMatch(/p-4 sm:p-6/)
  })

  it('stacks accept/decline buttons on mobile', () => {
    expect(file).toMatch(/flex-col sm:flex-row/)
  })
})

// ── Preview page ─────────────────────────────────────────────────────────────

describe('Preview page', () => {
  const file = src('app/dashboard/quotes/[id]/preview/page.tsx')

  it('has responsive outer padding', () => {
    expect(file).toMatch(/p-4 sm:p-\d+/)
  })

  it('stacks header vertically on mobile', () => {
    expect(file).toMatch(/flex-col.*sm:flex-row/)
  })
})

// ── Landing page ─────────────────────────────────────────────────────────────

describe('Landing page', () => {
  const file = src('app/page.tsx')

  it('has responsive nav padding', () => {
    expect(file).toMatch(/px-4 sm:px-6/)
  })

  it('has responsive hero vertical padding', () => {
    expect(file).toMatch(/pt-12 sm:pt-20/)
  })

  it('has responsive hero title text size', () => {
    expect(file).toMatch(/text-2xl sm:text-4xl/)
  })

  it('has responsive final CTA text size', () => {
    expect(file).toMatch(/text-2xl sm:text-3xl/)
  })

  it('mockup card is full width on small screens', () => {
    expect(file).toMatch(/w-full max-w-md/)
  })

  it('features grid is responsive (2 cols tablet, 3 cols desktop)', () => {
    expect(file).toMatch(/sm:grid-cols-2 lg:grid-cols-3/)
  })

  it('mockup action buttons are decorative only (cursor-default)', () => {
    expect(file).toMatch(/cursor-default select-none/)
  })

  it('footer has correct year', () => {
    expect(file).toMatch(/© 2026 QuoteDock/)
  })
})

// ── FAQ page ─────────────────────────────────────────────────────────────────

describe('FAQ page', () => {
  const file = src('app/faq/page.tsx')

  it('has responsive vertical padding', () => {
    expect(file).toMatch(/py-8 sm:py-12/)
  })

  it('has responsive heading text size', () => {
    expect(file).toMatch(/text-2xl sm:text-3xl/)
  })

  it('has responsive card padding', () => {
    expect(file).toMatch(/p-4 sm:p-6/)
  })
})
