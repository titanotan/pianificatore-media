import { describe, expect, it } from 'vitest'
import { computePlan, goalToAverage, type PlanInput } from './simulation'
import type { FutureExam, PassedExam, Prediction } from './types'

const passed = (id: string, cfu: number, grade: number, lode = false): PassedExam => ({
  id,
  name: id,
  cfu,
  grade,
  lode,
})

const future = (id: string, cfu: number): FutureExam => ({
  id,
  name: id,
  cfu,
  difficulty: 'medium',
})

const predict = (grade: number, locked = false, lode = false): Prediction => ({
  grade,
  lode,
  locked,
})

/** Libretto di esempio: 4 esami da 15 CFU con media 26 (60 CFU). */
const passedExams = [
  passed('p1', 15, 24),
  passed('p2', 15, 26),
  passed('p3', 15, 27),
  passed('p4', 15, 27),
]

/** Tre esami futuri da 20 CFU (60 CFU). */
const futureExams = [future('f1', 20), future('f2', 20), future('f3', 20)]

const input = (overrides: Partial<PlanInput> = {}): PlanInput => ({
  passedExams,
  futureExams,
  predictions: {},
  settings: { lodeValue: 30 },
  goal: { kind: 'average', value: 27 },
  ...overrides,
})

describe('computePlan', () => {
  it('riassume libretto ed esami futuri', () => {
    const plan = computePlan(input())
    expect(plan.passed.average).toBeCloseTo(26)
    expect(plan.passed.cfu).toBe(60)
    expect(plan.future.cfu).toBe(60)
    expect(plan.totalCfu).toBe(120)
    expect(plan.goalAverage).toBe(27)
  })

  it('senza voti previsti la media necessaria è su tutti gli esami futuri', () => {
    const plan = computePlan(input())
    expect(plan.future.freeCfu).toBe(60)
    expect(plan.evaluation!.required).toBeCloseTo(28)
    expect(plan.evaluation!.status).toBe('reachable')
  })

  it('un voto bloccato cambia la media necessaria sugli esami restanti', () => {
    // Bloccando 30 su f1: (27×120 − 1560 − 600) / 40 = 27
    const plan = computePlan(input({ predictions: { f1: predict(30, true) } }))
    expect(plan.future.lockedCfu).toBe(20)
    expect(plan.future.freeCfu).toBe(40)
    expect(plan.evaluation!.required).toBeCloseTo(27)
  })

  it('un voto basso bloccato può rendere l’obiettivo impossibile', () => {
    // 18 su f1 e f2 bloccati: (3240 − 1560 − 720) / 20 = 48
    const plan = computePlan(
      input({ predictions: { f1: predict(18, true), f2: predict(18, true) } }),
    )
    expect(plan.evaluation!.status).toBe('impossible')
  })

  it('un voto previsto ma non bloccato non cambia la media necessaria', () => {
    const plan = computePlan(input({ predictions: { f1: predict(30) } }))
    expect(plan.future.predictedCfu).toBe(20)
    expect(plan.future.freeCfu).toBe(60)
    expect(plan.evaluation!.required).toBeCloseTo(28)
  })

  it('la media prevista include tutti i voti previsti, bloccati o no', () => {
    // (1560 + 30×20 + 24×20) / 100 = 26.4
    const plan = computePlan(input({ predictions: { f1: predict(30), f2: predict(24, true) } }))
    expect(plan.projection.average).toBeCloseTo(26.4)
    expect(plan.projection.cfu).toBe(100)
    expect(plan.projection.complete).toBe(false)
  })

  it('con tutti i voti previsti la media prevista è quella finale', () => {
    const plan = computePlan(
      input({ predictions: { f1: predict(28), f2: predict(28), f3: predict(28) } }),
    )
    expect(plan.projection.complete).toBe(true)
    expect(plan.projection.average).toBeCloseTo(27) // (1560 + 1680) / 120
  })

  it('tutti bloccati: lo stato dipende solo dalla media finale', () => {
    const all = (grade: number) => ({
      f1: predict(grade, true),
      f2: predict(grade, true),
      f3: predict(grade, true),
    })
    const reached = computePlan(input({ predictions: all(28) }))
    expect(reached.evaluation!.required).toBeNull()
    expect(reached.evaluation!.status).toBe('reached')

    expect(computePlan(input({ predictions: all(27) })).evaluation!.status).toBe('impossible')
  })

  it('la lode nei voti previsti usa il valore impostato', () => {
    const predictions = { f1: predict(30, true, true) }
    const withLode33 = computePlan(input({ predictions, settings: { lodeValue: 33 } }))
    expect(withLode33.future.lockedSum).toBe(33 * 20)
    const withLode30 = computePlan(input({ predictions, settings: { lodeValue: 30 } }))
    expect(withLode30.future.lockedSum).toBe(30 * 20)
  })

  it('ignora previsioni di esami che non esistono più', () => {
    const plan = computePlan(input({ predictions: { fantasma: predict(30, true) } }))
    expect(plan.future.lockedCount).toBe(0)
    expect(plan.evaluation!.required).toBeCloseTo(28)
  })

  it('senza obiettivo calcola le medie ma non la valutazione', () => {
    const plan = computePlan(input({ goal: null }))
    expect(plan.passed.average).toBeCloseTo(26)
    expect(plan.goalAverage).toBeNull()
    expect(plan.evaluation).toBeNull()
  })

  it('senza nessun esame non c’è nulla da valutare', () => {
    const plan = computePlan(input({ passedExams: [], futureExams: [] }))
    expect(plan.passed.average).toBeNull()
    expect(plan.projection.average).toBeNull()
    expect(plan.evaluation).toBeNull()
  })

  it('solo esami sostenuti: obiettivo già raggiunto o mancato', () => {
    const reached = computePlan(input({ futureExams: [], goal: { kind: 'average', value: 26 } }))
    expect(reached.evaluation!.status).toBe('reached')
    const missed = computePlan(input({ futureExams: [], goal: { kind: 'average', value: 26.5 } }))
    expect(missed.evaluation!.status).toBe('impossible')
  })

  it('solo esami futuri: serve esattamente l’obiettivo', () => {
    const plan = computePlan(input({ passedExams: [] }))
    expect(plan.passed.average).toBeNull()
    expect(plan.evaluation!.required).toBeCloseTo(27)
  })
})

describe('goalToAverage', () => {
  it('converte l’obiettivo in media', () => {
    expect(goalToAverage({ kind: 'average', value: 27.5 })).toBe(27.5)
    expect(goalToAverage(null)).toBeNull()
  })
})
