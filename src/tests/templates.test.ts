/**
 * Templates feature tests
 *
 * Verifies that the templates data, listing page, and preview page are
 * correctly structured: bilingual content, no hardcoded text, responsive
 * classes, and correct server-action wiring.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { templates, getTemplate, calcTemplateSubtotal } from '../lib/templates'

const root = resolve(__dirname, '../../')
const src = (rel: string) => readFileSync(resolve(root, 'src', rel), 'utf-8')

// ── Template data ─────────────────────────────────────────────────────────────

describe('templates data', () => {
  it('has at least 5 templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(5)
  })

  it('every template has a unique slug', () => {
    const slugs = templates.map(t => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every template has bilingual title, subtitle, industry, notes', () => {
    for (const t of templates) {
      expect(t.title.he).toBeTruthy()
      expect(t.title.en).toBeTruthy()
      expect(t.subtitle.he).toBeTruthy()
      expect(t.subtitle.en).toBeTruthy()
      expect(t.industry.he).toBeTruthy()
      expect(t.industry.en).toBeTruthy()
      expect(t.notes.he).toBeTruthy()
      expect(t.notes.en).toBeTruthy()
    }
  })

  it('every template has at least one item with bilingual name and description', () => {
    for (const t of templates) {
      expect(t.items.length).toBeGreaterThan(0)
      for (const item of t.items) {
        expect(item.name.he).toBeTruthy()
        expect(item.name.en).toBeTruthy()
        expect(item.description.he).toBeTruthy()
        expect(item.description.en).toBeTruthy()
        expect(item.unit_price).toBeGreaterThan(0)
        expect(item.quantity).toBeGreaterThan(0)
      }
    }
  })

  it('no em-dashes in any template text', () => {
    const allText = templates.flatMap(t => [
      t.title.he, t.title.en,
      t.subtitle.he, t.subtitle.en,
      t.notes.he, t.notes.en,
      ...t.items.flatMap(i => [i.name.he, i.name.en, i.description.he, i.description.en]),
    ]).join('\n')
    expect(allText).not.toMatch(/—/)
  })
})

describe('getTemplate', () => {
  it('returns the correct template by slug', () => {
    const t = getTemplate('renovation')
    expect(t).toBeDefined()
    expect(t!.slug).toBe('renovation')
  })

  it('returns undefined for unknown slug', () => {
    expect(getTemplate('does-not-exist')).toBeUndefined()
  })

  it('includes expected slugs: real-estate, legal, renovation, travel, sports', () => {
    for (const slug of ['real-estate', 'legal', 'renovation', 'travel', 'sports']) {
      expect(getTemplate(slug)).toBeDefined()
    }
  })
})

describe('calcTemplateSubtotal', () => {
  it('sums unit_price * quantity for all items', () => {
    const t = getTemplate('sports')!
    const expected = t.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    expect(calcTemplateSubtotal(t)).toBe(expected)
  })

  it('returns a positive number for every template', () => {
    for (const t of templates) {
      expect(calcTemplateSubtotal(t)).toBeGreaterThan(0)
    }
  })
})

// ── Templates listing page ────────────────────────────────────────────────────

describe('Templates listing page', () => {
  const file = src('app/templates/page.tsx')

  it('is a server component (no "use client")', () => {
    expect(file).not.toMatch(/"use client"/)
  })

  it('reads lang from qdl cookie', () => {
    expect(file).toMatch(/qdl/)
    expect(file).toMatch(/cookies\(\)/)
  })

  it('has responsive grid (sm:grid-cols-2 lg:grid-cols-3)', () => {
    expect(file).toMatch(/sm:grid-cols-2/)
    expect(file).toMatch(/lg:grid-cols-3/)
  })

  it('links to individual template preview pages', () => {
    expect(file).toMatch(/\/templates\/\$\{template\.slug\}/)
  })

  it('shows industry badge in saffron', () => {
    expect(file).toMatch(/text-saffron/)
  })

  it('has dynamic nav back link (homepage for guests, dashboard/templates for users)', () => {
    expect(file).toMatch(/backHref/)
    expect(file).toMatch(/dashboard\/templates/)
  })

  it('has no hardcoded user-facing Hebrew without bilingual object', () => {
    // copy object must exist with he and en keys
    expect(file).toMatch(/he:\s*\{/)
    expect(file).toMatch(/en:\s*\{/)
  })
})

// ── Template preview page ─────────────────────────────────────────────────────

describe('Template preview page (/templates/[slug])', () => {
  const file = src('app/templates/[slug]/page.tsx')

  it('is a server component (no "use client")', () => {
    expect(file).not.toMatch(/"use client"/)
  })

  it('calls notFound() for unknown slug', () => {
    expect(file).toMatch(/notFound\(\)/)
  })

  it('reads lang from qdl cookie', () => {
    expect(file).toMatch(/qdl/)
  })

  it('checks for authenticated user', () => {
    expect(file).toMatch(/auth\.getUser\(\)/)
  })

  it('shows items in a desktop table (hidden sm:table)', () => {
    expect(file).toMatch(/hidden sm:table/)
  })

  it('shows items as mobile cards (sm:hidden)', () => {
    expect(file).toMatch(/sm:hidden/)
  })

  it('wires up createFromTemplate server action', () => {
    expect(file).toMatch(/createFromTemplate/)
  })

  it('links to signup with redirect param for unauthenticated users', () => {
    expect(file).toMatch(/auth\/signup\?redirect=/)
  })

  it('links to login with redirect param for unauthenticated users', () => {
    expect(file).toMatch(/auth\/login\?redirect=/)
  })

  it('has VAT line in totals', () => {
    expect(file).toMatch(/DEMO_VAT_RATE/)
  })

  it('has no em-dashes in copy strings', () => {
    // Extract just the copy object region
    const copyStart = file.indexOf('const copy =')
    const copyEnd = file.indexOf('function fmt(')
    const copyRegion = file.slice(copyStart, copyEnd)
    expect(copyRegion).not.toMatch(/—/)
  })

  it('has bilingual copy (he and en keys)', () => {
    expect(file).toMatch(/he:\s*\{/)
    expect(file).toMatch(/en:\s*\{/)
  })
})

// ── Auth redirect support ─────────────────────────────────────────────────────

describe('Login page redirect support', () => {
  const file = src('app/auth/login/page.tsx')

  it('imports useSearchParams', () => {
    expect(file).toMatch(/useSearchParams/)
  })

  it('reads redirect param', () => {
    expect(file).toMatch(/searchParams\.get\('redirect'\)/)
  })

  it('redirects to param value after login', () => {
    expect(file).toMatch(/redirectTo/)
  })
})

describe('Signup page redirect support', () => {
  const file = src('app/auth/signup/page.tsx')

  it('imports useSearchParams', () => {
    expect(file).toMatch(/useSearchParams/)
  })

  it('reads redirect param', () => {
    expect(file).toMatch(/searchParams\.get\('redirect'\)/)
  })

  it('redirects to param value after signup', () => {
    expect(file).toMatch(/redirectTo/)
  })
})
