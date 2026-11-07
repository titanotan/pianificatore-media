import { describe, expect, it } from 'vitest'
import { groupExams, planForGroup, validateGroupName } from './group'
import { planForScenario } from './scenarios'
import { createEmptyData, type AppData, type Scenario } from './types'

/**
 * Libretto: A (30 CFU, 23) e B (30 CFU, 25, nel gruppo) → media generale 24, del gruppo 25.
 * Futuri: F1 (12 CFU, nel gruppo) e F2 (24 CFU, fuori dal gruppo).
 */
const data = (goal: number | null = 27): AppData => ({
  ...createEmptyData(),
  passedExams: [
    { id: 'a', name: 'A', cfu: 30, grade: 23, lode: false },
    { id: 'b', name: 'B', cfu: 30, grade: 25, lode: false, inGroup: true },
  ],
  futureExams: [
    { id: 'f1', name: 'F1', cfu: 12, difficulty: 'hard', inGroup: true },
    { id: 'f2', name: 'F2', cfu: 24, difficulty: 'easy' },
  ],
  group: {
    enabled: true,
    name: 'Caratterizzanti',
    goal: goal === null ? null : { kind: 'average', value: goal },
  },
})

const scenario = (predictions: Scenario['predictions'] = {}): Scenario => ({
  id: 's',
  name: '',
  goal: { kind: 'average', value: 26 },
  predictions,
})

describe('groupExams', () => {
  it('seleziona solo gli esami del gruppo', () => {
    const { passed, future } = groupExams(data())
    expect(passed.map((e) => e.id)).toEqual(['b'])
    expect(future.map((e) => e.id)).toEqual(['f1'])
  })
})

describe('planForGroup', () => {
  it('media del gruppo calcolata solo sui suoi esami', () => {
    const plan = planForGroup(data(), null)
    expect(plan.passed.average).toBeCloseTo(25)
    expect(plan.passed.cfu).toBe(30)
    expect(plan.future.cfu).toBe(12)
  })

  it('la media generale non cambia', () => {
    expect(planForScenario(data(), null).passed.average).toBeCloseTo(24)
  })

  it('media necessaria negli esami del gruppo per l’obiettivo del gruppo', () => {
    // (27 × 42 − 750) / 12 = 32 → non raggiungibile; con obiettivo 26: (1092 − 750)/12 = 28,5
    expect(planForGroup(data(27), null).evaluation!.status).toBe('impossible')
    const plan = planForGroup(data(26), null)
    expect(plan.evaluation!.required).toBeCloseTo(28.5)
    expect(plan.evaluation!.status).toBe('reachable')
  })

  it('usa i voti previsti e bloccati della simulazione selezionata', () => {
    const plan = planForGroup(
      data(26),
      scenario({
        f1: { grade: 30, lode: false, locked: true },
        f2: { grade: 18, lode: false, locked: true },
      }),
    )
    // Solo F1 conta per il gruppo: (750 + 360) / 42 = 26,43
    expect(plan.projection.average).toBeCloseTo(26.4286, 3)
    expect(plan.evaluation!.status).toBe('reached')
    expect(plan.evaluation!.required).toBeNull()
  })

  it('senza obiettivo del gruppo: medie sì, valutazione no', () => {
    const plan = planForGroup(data(null), null)
    expect(plan.passed.average).toBeCloseTo(25)
    expect(plan.evaluation).toBeNull()
  })

  it('gruppo senza esami: nessuna media', () => {
    const empty = { ...data(), passedExams: [], futureExams: [] }
    const plan = planForGroup(empty, null)
    expect(plan.passed.average).toBeNull()
    expect(plan.evaluation).toBeNull()
  })
})

describe('validateGroupName', () => {
  it('pulisce gli spazi e rifiuta nomi vuoti o troppo lunghi', () => {
    expect(validateGroupName('  Esami   caratterizzanti ')).toEqual({
      value: 'Esami caratterizzanti',
    })
    expect(validateGroupName('  ').error).toBe('Dai un nome al gruppo.')
    expect(validateGroupName('x'.repeat(41)).error).toMatch(/al massimo 40/)
  })
})
