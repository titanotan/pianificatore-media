import { describe, expect, it } from 'vitest'
import { resolveTheme, toggleTheme } from './theme'

describe('resolveTheme', () => {
  it('rispetta la scelta salvata, anche contro la preferenza di sistema', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('senza scelta valida segue il sistema', () => {
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme(null, false)).toBe('light')
    expect(resolveTheme('blu', true)).toBe('dark')
  })
})

describe('toggleTheme', () => {
  it('alterna chiaro e scuro', () => {
    expect(toggleTheme('light')).toBe('dark')
    expect(toggleTheme('dark')).toBe('light')
  })
})
