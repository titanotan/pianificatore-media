import { describe, expect, it } from 'vitest'
import { formatAverage, formatCfu, formatGrade, formatRequired, parseDecimal } from './format'

describe('formatAverage', () => {
  it('usa la virgola e due decimali', () => {
    expect(formatAverage(26.8421)).toBe('26,84')
    expect(formatAverage(27)).toBe('27,00')
    expect(formatAverage(26.845)).toMatch(/^26,8[45]$/)
  })

  it('mostra un trattino se il valore manca', () => {
    expect(formatAverage(null)).toBe('—')
  })
})

describe('formatRequired', () => {
  it('arrotonda per eccesso per non sottostimare quello che serve', () => {
    expect(formatRequired(28.121)).toBe('28,13')
    expect(formatRequired(28.12)).toBe('28,12')
    expect(formatRequired(28)).toBe('28,00')
  })

  it('non gonfia i valori per errori di arrotondamento', () => {
    expect(formatRequired(27.000000000001)).toBe('27,00')
  })

  it('mostra un trattino se il valore manca', () => {
    expect(formatRequired(null)).toBe('—')
  })
})

describe('formatCfu e formatGrade', () => {
  it('formattano CFU e voti', () => {
    expect(formatCfu(180)).toBe('180 CFU')
    expect(formatGrade(30, true)).toBe('30L')
    expect(formatGrade(27, false)).toBe('27')
  })
})

describe('parseDecimal', () => {
  it('accetta virgola o punto', () => {
    expect(parseDecimal('27,5')).toBe(27.5)
    expect(parseDecimal('27.5')).toBe(27.5)
    expect(parseDecimal(' 28 ')).toBe(28)
  })

  it('rifiuta testo non numerico o vuoto', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('27,5,1')).toBeNull()
    expect(parseDecimal('1e3')).toBeNull()
    expect(parseDecimal('27 5')).toBeNull()
  })
})
