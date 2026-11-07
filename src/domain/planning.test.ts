import { describe, expect, it } from 'vitest'
import { evaluateGoal, goalProgress, requiredAverage, statusForRequired } from './planning'

describe('requiredAverage', () => {
  it('calcola la media che serve negli esami liberi', () => {
    // 60 CFU sostenuti a 26 di media, obiettivo 27 su 120 CFU totali:
    // (27×120 − 26×60) / 60 = 28
    expect(requiredAverage(27, 26 * 60, 60, 60)).toBeCloseTo(28)
  })

  it('senza esami sostenuti la media necessaria è l’obiettivo stesso', () => {
    expect(requiredAverage(27.5, 0, 0, 30)).toBeCloseTo(27.5)
  })

  it('rifiuta il calcolo senza CFU liberi', () => {
    expect(() => requiredAverage(27, 100, 4, 0)).toThrow(RangeError)
  })
})

describe('statusForRequired', () => {
  it('distingue tutte le fasce', () => {
    expect(statusForRequired(17, 30)).toBe('reached')
    expect(statusForRequired(18, 30)).toBe('reached')
    expect(statusForRequired(24, 30)).toBe('reachable')
    expect(statusForRequired(28.99, 30)).toBe('reachable')
    expect(statusForRequired(29, 30)).toBe('tight')
    expect(statusForRequired(30, 30)).toBe('tight')
    expect(statusForRequired(30.5, 33)).toBe('lode-only')
    expect(statusForRequired(33, 33)).toBe('lode-only')
    expect(statusForRequired(33.1, 33)).toBe('impossible')
  })

  it('con lode che vale 30, sopra 30 è impossibile', () => {
    expect(statusForRequired(30.01, 30)).toBe('impossible')
  })

  it('non si lascia ingannare dagli errori di arrotondamento', () => {
    expect(statusForRequired(30.000000000001, 30)).toBe('tight')
    expect(statusForRequired(17.999999999999, 30)).toBe('reached')
  })
})

describe('evaluateGoal', () => {
  const base = { lodeValue: 30 }

  it('obiettivo raggiungibile: restituisce media necessaria e limiti', () => {
    const result = evaluateGoal({
      ...base,
      goal: 27,
      fixedSum: 26 * 60,
      fixedCfu: 60,
      freeCfu: 60,
    })!
    expect(result.status).toBe('reachable')
    expect(result.required).toBeCloseTo(28)
    expect(result.minFinal).toBeCloseTo(22) // (1560 + 18×60) / 120
    expect(result.maxFinalWithoutLode).toBeCloseTo(28) // (1560 + 30×60) / 120
    expect(result.maxFinal).toBeCloseTo(28)
  })

  it('già raggiunto: basta anche 18 ovunque', () => {
    const result = evaluateGoal({
      ...base,
      goal: 25,
      fixedSum: 30 * 150,
      fixedCfu: 150,
      freeCfu: 30,
    })!
    expect(result.status).toBe('reached')
    expect(result.required!).toBeLessThanOrEqual(18)
  })

  it('impossibile: servirebbe più di 30', () => {
    const result = evaluateGoal({
      ...base,
      goal: 29,
      fixedSum: 22 * 150,
      fixedCfu: 150,
      freeCfu: 30,
    })!
    expect(result.status).toBe('impossible')
    expect(result.required!).toBeGreaterThan(30)
    expect(result.maxFinal).toBeCloseTo((22 * 150 + 30 * 30) / 180)
  })

  it('solo con lodi: serve più di 30 ma meno del valore della lode', () => {
    // (30×60 − 29×30) / 30 = 31
    const input = { goal: 30, fixedSum: 29 * 30, fixedCfu: 30, freeCfu: 30 }
    expect(evaluateGoal({ ...input, lodeValue: 33 })!.status).toBe('lode-only')
    expect(evaluateGoal({ ...input, lodeValue: 30 })!.status).toBe('impossible')
  })

  it('al limite: serve tra 29 e 30', () => {
    // (28×60 − 26.5×30) / 30 = 29.5
    const result = evaluateGoal({
      ...base,
      goal: 28,
      fixedSum: 26.5 * 30,
      fixedCfu: 30,
      freeCfu: 30,
    })!
    expect(result.status).toBe('tight')
    expect(result.required).toBeCloseTo(29.5)
  })

  it('nessun esame libero: decide la media finale già determinata', () => {
    const reached = evaluateGoal({
      ...base,
      goal: 27,
      fixedSum: 27 * 180,
      fixedCfu: 180,
      freeCfu: 0,
    })!
    expect(reached.status).toBe('reached')
    expect(reached.required).toBeNull()

    const missed = evaluateGoal({
      ...base,
      goal: 27,
      fixedSum: 26.9 * 180,
      fixedCfu: 180,
      freeCfu: 0,
    })!
    expect(missed.status).toBe('impossible')
  })

  it('nessun esame sostenuto: serve esattamente l’obiettivo', () => {
    const result = evaluateGoal({ ...base, goal: 27, fixedSum: 0, fixedCfu: 0, freeCfu: 120 })!
    expect(result.required).toBeCloseTo(27)
    expect(result.status).toBe('reachable')
  })

  it('nessun esame del tutto: nessuna valutazione', () => {
    expect(evaluateGoal({ ...base, goal: 27, fixedSum: 0, fixedCfu: 0, freeCfu: 0 })).toBeNull()
  })
})

describe('goalProgress', () => {
  it('misura l’avanzamento da 18 all’obiettivo', () => {
    expect(goalProgress(18, 28)).toBe(0)
    expect(goalProgress(23, 28)).toBeCloseTo(0.5)
    expect(goalProgress(28, 28)).toBe(1)
  })

  it('resta tra 0 e 1', () => {
    expect(goalProgress(30, 28)).toBe(1)
    expect(goalProgress(10, 28)).toBe(0)
    expect(goalProgress(25, 18)).toBe(1)
  })

  it('null se manca la media o l’obiettivo', () => {
    expect(goalProgress(null, 27)).toBeNull()
    expect(goalProgress(26, null)).toBeNull()
  })
})
