import { describe, expect, it } from 'vitest'
import { distributeGrades, generatePredictions, seededRandom } from './distribution'
import type { Difficulty, FutureExam } from './types'

const exam = (id: string, cfu: number, difficulty: Difficulty): FutureExam => ({
  id,
  name: id,
  cfu,
  difficulty,
})

/** Un percorso realistico: 8 esami di CFU e difficoltà diverse. */
const exams = [
  exam('a', 12, 'hard'),
  exam('b', 6, 'easy'),
  exam('c', 9, 'medium'),
  exam('d', 9, 'hard'),
  exam('e', 6, 'easy'),
  exam('f', 12, 'medium'),
  exam('g', 6, 'medium'),
  exam('h', 9, 'easy'),
]
const totalCfu = exams.reduce((s, e) => s + e.cfu, 0)
const maxCfu = Math.max(...exams.map((e) => e.cfu))
const weightedAverage = (grades: Record<string, number>) =>
  exams.reduce((s, e) => s + grades[e.id] * e.cfu, 0) / totalCfu

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)
const REQUIRED = [18.5, 21, 24.4, 26, 27.33, 28.9, 29.6, 30]

describe('distributeGrades', () => {
  it('voti interi tra 18 e 30, media ≥ media necessaria, senza eccessi', () => {
    for (const required of REQUIRED) {
      for (const seed of SEEDS) {
        const { grades, reachable, average } = distributeGrades(exams, required, {
          random: seededRandom(seed),
        })
        expect(reachable).toBe(true)
        for (const e of exams) {
          expect(Number.isInteger(grades[e.id])).toBe(true)
          expect(grades[e.id]).toBeGreaterThanOrEqual(18)
          expect(grades[e.id]).toBeLessThanOrEqual(30)
        }
        expect(average).toBeCloseTo(weightedAverage(grades), 10)
        expect(average!).toBeGreaterThanOrEqual(required - 1e-9)
        // Nessun voto si può abbassare restando sopra l'obiettivo: l'eccesso è meno di un "passo"
        expect(average! - required).toBeLessThan(maxCfu / totalCfu + 1e-9)
      }
    }
  })

  it('i facili hanno in media voti più alti dei difficili', () => {
    const sums: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 }
    const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 }
    for (const seed of SEEDS) {
      const { grades } = distributeGrades(exams, 26, { random: seededRandom(seed) })
      for (const e of exams) {
        sums[e.difficulty] += grades[e.id]
        counts[e.difficulty] += 1
      }
    }
    const mean = (d: Difficulty) => sums[d] / counts[d]
    expect(mean('easy')).toBeGreaterThan(mean('medium') + 0.5)
    expect(mean('medium')).toBeGreaterThan(mean('hard') + 0.5)
  })

  it('i voti sono variati e cambiano da una generazione all’altra', () => {
    const results = SEEDS.slice(0, 50).map(
      (seed) => distributeGrades(exams, 26, { random: seededRandom(seed) }).grades,
    )
    // Quasi sempre più di due voti diversi nella stessa proposta
    const varied = results.filter((g) => new Set(Object.values(g)).size > 2).length
    expect(varied).toBeGreaterThan(45)
    // Proposte diverse tra loro
    expect(new Set(results.map((g) => JSON.stringify(g))).size).toBeGreaterThan(30)
  })

  it('stesso seme, stessa proposta', () => {
    const a = distributeGrades(exams, 27, { random: seededRandom(42) })
    const b = distributeGrades(exams, 27, { random: seededRandom(42) })
    expect(a).toEqual(b)
  })

  it('obiettivo non raggiungibile: 30 ovunque', () => {
    const result = distributeGrades(exams, 31.2, { random: seededRandom(1) })
    expect(result.reachable).toBe(false)
    expect(Object.values(result.grades).every((g) => g === 30)).toBe(true)
  })

  it('serve esattamente 30: 30 ovunque', () => {
    const { grades } = distributeGrades(exams, 30, { random: seededRandom(7) })
    expect(Object.values(grades).every((g) => g === 30)).toBe(true)
  })

  it('obiettivo già raggiunto (serve meno di 18): voti bassi ma validi', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const { grades, reachable } = distributeGrades(exams, 15, { random: seededRandom(seed) })
      expect(reachable).toBe(true)
      expect(Object.values(grades).every((g) => g >= 18 && g <= 22)).toBe(true)
    }
  })

  it('nessun esame: nessun voto', () => {
    expect(distributeGrades([], 27)).toEqual({ grades: {}, reachable: true, average: null })
  })

  it('un solo esame: il voto intero minimo che basta', () => {
    expect(distributeGrades([exam('x', 6, 'hard')], 26.2).grades).toEqual({ x: 27 })
  })
})

describe('generatePredictions', () => {
  it('lascia intatti i voti bloccati e rigenera gli altri', () => {
    const current = {
      a: { grade: 30, lode: true, locked: true },
      b: { grade: 19, lode: false, locked: false },
    }
    const { predictions, reachable } = generatePredictions(exams, current, 26, {
      random: seededRandom(3),
    })
    expect(reachable).toBe(true)
    expect(predictions.a).toEqual({ grade: 30, lode: true, locked: true })
    expect(Object.keys(predictions).sort()).toEqual(exams.map((e) => e.id).sort())
    for (const e of exams.slice(1)) {
      expect(predictions[e.id].locked).toBe(false)
      expect(predictions[e.id].lode).toBe(false)
    }
  })

  it('ignora previsioni di esami che non sono in elenco', () => {
    const { predictions } = generatePredictions(
      [exam('x', 6, 'easy')],
      { altro: { grade: 25, lode: false, locked: true } },
      25,
      { random: seededRandom(1) },
    )
    expect(Object.keys(predictions)).toEqual(['x'])
  })
})
