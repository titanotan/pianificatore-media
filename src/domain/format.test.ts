import { describe, expect, it } from 'vitest'
import {
  formatAverage,
  formatCfu,
  formatDate,
  formatGrade,
  formatNumber,
  formatRequired,
  parseDecimal,
  todayIso,
} from './format'

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

describe('formatNumber, formatCfu e formatGrade', () => {
  it('formattano numeri, CFU e voti', () => {
    expect(formatNumber(31)).toBe('31')
    expect(formatNumber(31.5)).toBe('31,5')
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

describe('formatDate e todayIso', () => {
  it('mostra le date in italiano', () => {
    expect(formatDate('2025-02-10')).toBe('10 feb 2025')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('non-una-data')).toBe('—')
  })

  it('todayIso usa il formato AAAA-MM-GG', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
