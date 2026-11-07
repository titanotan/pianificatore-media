import { describe, expect, it } from 'vitest'
import { effectiveGrade, summarizePassedExams, weightedAverage } from './grades'
import type { PassedExam } from './types'

const exam = (cfu: number, grade: number, lode = false): PassedExam => ({
  id: `${cfu}-${grade}-${lode}`,
  name: 'Esame',
  cfu,
  grade,
  lode,
})

describe('effectiveGrade', () => {
  it('senza lode il voto resta invariato', () => {
    expect(effectiveGrade(27, false, 33)).toBe(27)
    expect(effectiveGrade(30, false, 33)).toBe(30)
  })

  it('30 e lode vale quanto impostato', () => {
    expect(effectiveGrade(30, true, 30)).toBe(30)
    expect(effectiveGrade(30, true, 31)).toBe(31)
    expect(effectiveGrade(30, true, 33)).toBe(33)
  })

  it('la lode è ignorata se il voto non è 30', () => {
    expect(effectiveGrade(28, true, 33)).toBe(28)
  })
})

describe('weightedAverage', () => {
  it('pesa ogni voto per i suoi CFU', () => {
    // (30×6 + 24×12) / 18 = 26
    expect(
      weightedAverage([
        { cfu: 6, value: 30 },
        { cfu: 12, value: 24 },
      ]),
    ).toBeCloseTo(26)
  })

  it('con CFU uguali coincide con la media aritmetica', () => {
    expect(
      weightedAverage([
        { cfu: 6, value: 25 },
        { cfu: 6, value: 28 },
      ]),
    ).toBeCloseTo(26.5)
  })

  it('restituisce null senza esami', () => {
    expect(weightedAverage([])).toBeNull()
  })
})

describe('summarizePassedExams', () => {
  it('calcola numero di esami, CFU e media ponderata', () => {
    const summary = summarizePassedExams([exam(9, 27), exam(6, 30), exam(12, 24)], {
      lodeValue: 30,
    })
    expect(summary.count).toBe(3)
    expect(summary.cfu).toBe(27)
    // (243 + 180 + 288) / 27 = 26.333...
    expect(summary.average).toBeCloseTo(26.3333, 4)
  })

  it('applica il valore della lode impostato', () => {
    const exams = [exam(6, 30, true), exam(6, 24)]
    expect(summarizePassedExams(exams, { lodeValue: 30 }).average).toBeCloseTo(27)
    expect(summarizePassedExams(exams, { lodeValue: 33 }).average).toBeCloseTo(28.5)
  })

  it('libretto vuoto: media assente', () => {
    const summary = summarizePassedExams([], { lodeValue: 30 })
    expect(summary).toEqual({ count: 0, cfu: 0, weightedSum: 0, average: null })
  })
})
