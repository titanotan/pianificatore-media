import { describe, expect, it } from 'vitest'
import { groupExams, validateGroupName } from './group'
import { buildScopeView, planAllScenarios, planForScenario, reachableRange } from './scenarios'
import { createEmptyData, type AppData, type Scenario } from './types'

const scenario = (
  id: string,
  value: number,
  predictions: Scenario['predictions'] = {},
): Scenario => ({
  id,
  name: '',
  goal: { kind: 'average', value },
  predictions,
})

/**
 * Libretto: A (30 CFU, 23) e B (30 CFU, 25, nel gruppo) → media generale 24, del gruppo 25.
 * Futuri: F1 (12 CFU, nel gruppo) e F2 (24 CFU, fuori dal gruppo).
 */
const data = (groupScenarios: Scenario[] = []): AppData => ({
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
    scenarios: groupScenarios,
    activeScenarioId: groupScenarios[0]?.id ?? null,
  },
})

describe('groupExams', () => {
  it('seleziona solo gli esami del gruppo', () => {
    const { passed, future } = groupExams(data())
    expect(passed.map((e) => e.id)).toEqual(['b'])
    expect(future.map((e) => e.id)).toEqual(['f1'])
  })
})

describe('pianificazione del gruppo (ambito group)', () => {
  it('media del gruppo calcolata solo sui suoi esami', () => {
    const plan = planForScenario(data(), null, 'group')
    expect(plan.passed.average).toBeCloseTo(25)
    expect(plan.passed.cfu).toBe(30)
    expect(plan.future.cfu).toBe(12)
  })

  it('la media generale non cambia', () => {
    expect(planForScenario(data(), null, 'main').passed.average).toBeCloseTo(24)
  })

  it('più obiettivi del gruppo, ciascuno con la sua media necessaria', () => {
    // 26: (26×42 − 750)/12 = 28,5 · 27: (27×42 − 750)/12 = 32
    const plans = planAllScenarios(data([scenario('g27', 27), scenario('g26', 26)]), 'group')
    expect(plans.map((p) => p.scenario.id)).toEqual(['g26', 'g27'])
    expect(plans[0].plan.evaluation!.required).toBeCloseTo(28.5)
    expect(plans[0].plan.evaluation!.status).toBe('reachable')
    expect(plans[1].plan.evaluation!.status).toBe('impossible')
  })

  it('la simulazione del gruppo considera solo gli esami del gruppo', () => {
    // F2 non è nel gruppo: il suo voto previsto viene ignorato. (750 + 360)/42 = 26,43
    const plan = planForScenario(
      data(),
      scenario('g', 26, {
        f1: { grade: 30, lode: false, locked: true },
        f2: { grade: 18, lode: false, locked: true },
      }),
      'group',
    )
    expect(plan.projection.average).toBeCloseTo(26.4286, 3)
    expect(plan.evaluation!.status).toBe('reached')
  })

  it('medie minima e massima del gruppo', () => {
    const range = reachableRange(data(), 'group')!
    expect(range.min).toBeCloseTo((750 + 18 * 12) / 42)
    expect(range.max).toBeCloseTo((750 + 30 * 12) / 42)
  })

  it('vista del gruppo: obiettivo selezionato e soli esami futuri del gruppo', () => {
    const view = buildScopeView(data([scenario('g26', 26), scenario('g27', 27)]), 'group')
    expect(view.scope).toBe('group')
    expect(view.activeScenario!.id).toBe('g26')
    expect(view.futureExams.map((e) => e.id)).toEqual(['f1'])
    expect(view.scenarioPlans).toHaveLength(2)
  })

  it('gruppo senza esami: nessuna media', () => {
    const empty = { ...data(), passedExams: [], futureExams: [] }
    const plan = planForScenario(empty, null, 'group')
    expect(plan.passed.average).toBeNull()
    expect(reachableRange(empty, 'group')).toBeNull()
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
