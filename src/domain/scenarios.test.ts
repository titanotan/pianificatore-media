import { describe, expect, it } from 'vitest'
import { scalePosition } from './planning'
import {
  nextActiveAfterRemoval,
  planAllScenarios,
  reachableRange,
  scenarioLabel,
  suggestGoals,
  validateScenarioGoal,
} from './scenarios'
import { createEmptyData, type AppData, type Scenario } from './types'

const scenario = (id: string, value: number, extra: Partial<Scenario> = {}): Scenario => ({
  id,
  name: '',
  goal: { kind: 'average', value },
  predictions: {},
  ...extra,
})

/** Media attuale 24 su 60 CFU, 60 CFU da sostenere. */
const data = (scenarios: Scenario[] = []): AppData => ({
  ...createEmptyData(),
  passedExams: [
    { id: 'p1', name: 'A', cfu: 30, grade: 23, lode: false },
    { id: 'p2', name: 'B', cfu: 30, grade: 25, lode: false },
  ],
  futureExams: [
    { id: 'f1', name: 'F1', cfu: 30, difficulty: 'hard' },
    { id: 'f2', name: 'F2', cfu: 30, difficulty: 'easy' },
  ],
  scenarios,
  activeScenarioId: scenarios[0]?.id ?? null,
})

describe('planAllScenarios', () => {
  it('calcola ogni obiettivo con la sua simulazione, ordinati per media', () => {
    const plans = planAllScenarios(
      data([
        scenario('s27', 27),
        scenario('s25', 25),
        // Con 30 bloccato su F1: (26×120 − 1440 − 900) / 30 = 26
        scenario('s26', 26, { predictions: { f1: { grade: 30, lode: false, locked: true } } }),
      ]),
    )
    expect(plans.map((p) => p.scenario.id)).toEqual(['s25', 's26', 's27'])
    expect(plans[0].plan.evaluation!.required).toBeCloseTo(26) // (25×120 − 1440) / 60
    expect(plans[1].plan.evaluation!.required).toBeCloseTo(26)
    expect(plans[2].plan.evaluation!.required).toBeCloseTo(30) // (27×120 − 1440) / 60
    expect(plans[2].plan.evaluation!.status).toBe('tight')
  })
})

describe('reachableRange', () => {
  it('media finale con 18 e con 30 in tutti gli esami futuri', () => {
    const range = reachableRange(data())!
    expect(range.min).toBeCloseTo(21) // (1440 + 1080) / 120
    expect(range.max).toBeCloseTo(27) // (1440 + 1800) / 120
    expect(range.maxWithLode).toBeCloseTo(27)
  })

  it('con la lode a 33 il massimo con lode sale', () => {
    const d = data()
    d.settings.lodeValue = 33
    expect(reachableRange(d)!.maxWithLode).toBeCloseTo(28.5)
  })

  it('senza esami: null', () => {
    expect(reachableRange(createEmptyData())).toBeNull()
  })
})

describe('suggestGoals', () => {
  it('propone le medie intere sopra quella attuale', () => {
    expect(suggestGoals(24, [])).toEqual([25, 26, 27, 28])
    expect(suggestGoals(24.3, [])).toEqual([25, 26, 27, 28])
  })

  it('salta quelle già presenti e si ferma a 30', () => {
    expect(suggestGoals(26.5, [27, 29])).toEqual([28, 30])
    expect(suggestGoals(30, [])).toEqual([30])
  })

  it('senza media attuale parte da 25', () => {
    expect(suggestGoals(null, [], 3)).toEqual([25, 26, 27])
  })
})

describe('validateScenarioGoal', () => {
  const existing = [scenario('a', 26), scenario('b', 27.5)]

  it('accetta una media nuova', () => {
    expect(validateScenarioGoal('28', existing)).toEqual({ value: 28 })
  })

  it('rifiuta un obiettivo già presente', () => {
    expect(validateScenarioGoal('27,5', existing).error).toBe(
      'Hai già un obiettivo con media 27,50.',
    )
  })

  it('in modifica ignora l’obiettivo stesso', () => {
    expect(validateScenarioGoal('26', existing, 'a')).toEqual({ value: 26 })
  })

  it('riporta gli errori di formato', () => {
    expect(validateScenarioGoal('35', existing).error).toMatch(/tra 18 e 30/)
  })
})

describe('nextActiveAfterRemoval', () => {
  const list = [scenario('s25', 25), scenario('s26', 26), scenario('s27', 27)]

  it('seleziona il successivo, o il precedente se era l’ultimo', () => {
    expect(nextActiveAfterRemoval(list, 's26')).toBe('s27')
    expect(nextActiveAfterRemoval(list, 's27')).toBe('s26')
    expect(nextActiveAfterRemoval([list[0]], 's25')).toBeNull()
  })
})

describe('scenarioLabel', () => {
  it('usa il nome se presente, altrimenti la media', () => {
    expect(scenarioLabel(scenario('a', 27))).toBe('Media 27,00')
    expect(scenarioLabel(scenario('a', 27, { name: 'Ambizioso' }))).toBe('Ambizioso')
  })
})

describe('scalePosition', () => {
  it('posizione sulla scala 18–30', () => {
    expect(scalePosition(18)).toBe(0)
    expect(scalePosition(24)).toBeCloseTo(0.5)
    expect(scalePosition(30)).toBe(1)
    expect(scalePosition(31)).toBe(1)
    expect(scalePosition(null)).toBeNull()
  })
})
