/**
 * Tests for share message placeholder replacement logic (mirrors share-dialog.tsx)
 */
import { describe, it, expect } from 'vitest'

// Mirrors the full replacement logic in share-dialog.tsx (Hebrew + English placeholders)
function applyTemplate(template: string, { firstName, fullName, title, url }: {
  firstName: string; fullName: string; title: string; url: string
}): string {
  return template
    .replace(/\{\{שם_פרטי\}\}/g, firstName)
    .replace(/\{\{שם_מלא\}\}/g, fullName)
    .replace(/\{\{כותרת\}\}/g, title)
    .replace(/\{\{לינק\}\}/g, url)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{full_name\}\}/g, fullName)
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{link\}\}/g, url)
}

describe('share message placeholder replacement', () => {
  const url = 'https://quotedock.vercel.app/q/abc123'

  it('replaces {{שם_פרטי}} with first name', () => {
    const result = applyTemplate('היי {{שם_פרטי}},', { firstName: 'דני', fullName: 'דני לוי', title: 'פרויקט', url })
    expect(result).toBe('היי דני,')
  })

  it('replaces {{שם_מלא}} with full name', () => {
    const result = applyTemplate('שלום {{שם_מלא}}', { firstName: 'דני', fullName: 'דני לוי', title: 'פרויקט', url })
    expect(result).toBe('שלום דני לוי')
  })

  it('replaces {{כותרת}} with quote title', () => {
    const result = applyTemplate('הצעה: {{כותרת}}', { firstName: '', fullName: '', title: 'אתר וורדפרס', url })
    expect(result).toBe('הצעה: אתר וורדפרס')
  })

  it('replaces {{לינק}} with url', () => {
    const result = applyTemplate('{{לינק}}', { firstName: '', fullName: '', title: '', url })
    expect(result).toBe(url)
  })

  it('replaces multiple placeholders in one template', () => {
    const template = 'היי {{שם_פרטי}},\n\n{{כותרת}}\n{{לינק}}'
    const result = applyTemplate(template, { firstName: 'רוני', fullName: 'רוני כהן', title: 'אפליקציה', url })
    expect(result).toBe(`היי רוני,\n\nאפליקציה\n${url}`)
  })

  it('replaces all occurrences of the same placeholder', () => {
    const result = applyTemplate('{{לינק}} ו־{{לינק}}', { firstName: '', fullName: '', title: '', url: 'http://x' })
    expect(result).toBe('http://x ו־http://x')
  })

  it('leaves unrecognised placeholders untouched', () => {
    const result = applyTemplate('{{לא_קיים}}', { firstName: '', fullName: '', title: '', url: '' })
    expect(result).toBe('{{לא_קיים}}')
  })
})
