import { describe, it, expect } from 'vitest'
import { t, getLang } from '@/lib/i18n'

describe('translations', () => {
  it('Hebrew and English have the same keys', () => {
    const heKeys = Object.keys(t.he).sort()
    const enKeys = Object.keys(t.en).sort()
    expect(heKeys).toEqual(enKeys)
  })

  it('no empty translation values in Hebrew', () => {
    Object.entries(t.he).forEach(([key, val]) => {
      expect(val, `Key "${key}" is empty in Hebrew`).toBeTruthy()
    })
  })

  it('no empty translation values in English', () => {
    Object.entries(t.en).forEach(([key, val]) => {
      expect(val, `Key "${key}" is empty in English`).toBeTruthy()
    })
  })
})

describe('getLang', () => {
  it('returns he for Hebrew', () => {
    expect(getLang('he')).toBe('he')
  })

  it('returns en for English', () => {
    expect(getLang('en')).toBe('en')
  })

  it('defaults to he for unknown lang', () => {
    expect(getLang('fr')).toBe('he')
    expect(getLang('')).toBe('he')
  })
})
