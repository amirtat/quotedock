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

describe('share message — English placeholders', () => {
  const url = 'https://quotedock.vercel.app/q/abc123'

  it('replaces {{first_name}} with first name', () => {
    const result = applyTemplate('Hi {{first_name}},', { firstName: 'Danny', fullName: 'Danny Levy', title: 'Project', url })
    expect(result).toBe('Hi Danny,')
  })

  it('replaces {{full_name}} with full name', () => {
    const result = applyTemplate('Hello {{full_name}}', { firstName: 'Danny', fullName: 'Danny Levy', title: 'Project', url })
    expect(result).toBe('Hello Danny Levy')
  })

  it('replaces {{title}} with quote title', () => {
    const result = applyTemplate('Quote: {{title}}', { firstName: '', fullName: '', title: 'Website Design', url })
    expect(result).toBe('Quote: Website Design')
  })

  it('replaces {{link}} with url', () => {
    const result = applyTemplate('{{link}}', { firstName: '', fullName: '', title: '', url })
    expect(result).toBe(url)
  })

  it('replaces multiple English placeholders in one template', () => {
    const template = 'Hi {{first_name}},\n\nThe quote is here:\n{{link}}'
    const result = applyTemplate(template, { firstName: 'Roni', fullName: 'Roni Cohen', title: 'App', url })
    expect(result).toBe(`Hi Roni,\n\nThe quote is here:\n${url}`)
  })

  it('Hebrew and English placeholders can coexist in same template', () => {
    const template = '{{שם_פרטי}} / {{first_name}}'
    const result = applyTemplate(template, { firstName: 'Dana', fullName: '', title: '', url: '' })
    expect(result).toBe('Dana / Dana')
  })
})
