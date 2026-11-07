import { describe, expect, it } from 'vitest'
import { describeGoal } from './messages'
import { computePlan, type PlanInput } from './simulation'
import type { FutureExam, PassedExam, Prediction } from './types'

const passed = (id: string, cfu: number, grade: number): PassedExam => ({
  id,
  name: id,
  cfu,
  grade,
  lode: false,
})
const future = (id: string, cfu: number): FutureExam => ({
  id,
  name: id,
  cfu,
  difficulty: 'medium',
})
const locked = (grade: number): Prediction => ({ grade, lode: false, locked: true })

/** 60 CFU sostenuti con media 26, 60 CFU futuri in tre esami da 20. */
const base: PlanInput = {
  passedExams: [passed('a', 30, 25), passed('b', 30, 27)],
  futureExams: [future('f1', 20), future('f2', 20), future('f3', 20)],
  predictions: {},
  settings: { lodeValue: 30 },
  goal: { kind: 'average', value: 27 },
}

const describe_ = (overrides: Partial<PlanInput> = {}) => {
  const input = { ...base, ...overrides }
  return describeGoal(computePlan(input), input.settings.lodeValue)
}
const goal = (value: number) => ({ goal: { kind: 'average' as const, value } })

describe('describeGoal', () => {
  it('nessun obiettivo: nessun messaggio', () => {
    expect(describe_({ goal: null })).toBeNull()
  })

  it('nessun esame: invita ad aggiungerli', () => {
    const msg = describe_({ passedExams: [], futureExams: [] })!
    expect(msg.status).toBeNull()
    expect(msg.detail).toMatch(/Aggiungi gli esami/)
  })

  it('raggiungibile: indica media e CFU rimanenti', () => {
    const msg = describe_()!
    expect(msg).toMatchObject({ status: 'reachable', title: 'Raggiungibile', tone: 'ok' })
    expect(msg.detail).toBe('Ti serve una media di 28,00 nei 60 CFU rimanenti.')
  })

  it('con voti bloccati parla di esami non bloccati', () => {
    // Bloccato 30 su f1: (27×120 − 1560 − 600) / 40 = 27
    const msg = describe_({ predictions: { f1: locked(30) } })!
    expect(msg.detail).toBe('Ti serve una media di 27,00 nei 40 CFU non bloccati.')
  })

  it('al limite', () => {
    // Obiettivo 28: (28×120 − 1560) / 60 = 30
    const msg = describe_(goal(28))!
    expect(msg).toMatchObject({ status: 'tight', tone: 'warn' })
    expect(msg.detail).toMatch(/30,00 nei 60 CFU rimanenti: quasi il massimo/)
  })

  it('solo con lodi: cita il valore della lode', () => {
    const msg = describe_({ ...goal(28.5), settings: { lodeValue: 33 } })!
    expect(msg.status).toBe('lode-only')
    expect(msg.detail).toMatch(/31,00.*la lode vale 33/)
  })

  it('impossibile: indica il massimo raggiungibile', () => {
    const msg = describe_(goal(29))!
    expect(msg).toMatchObject({ status: 'impossible', title: 'Non raggiungibile', tone: 'danger' })
    // (1560 + 30×60) / 120 = 28
    expect(msg.detail).toBe(
      'Anche con 30 in tutti gli esami rimanenti arriveresti al massimo a 28,00.',
    )
  })

  it('impossibile con lode > 30: parla di 30 e lode', () => {
    const msg = describe_({ ...goal(29), settings: { lodeValue: 31 } })!
    expect(msg.detail).toMatch(/Anche con 30 e lode/)
  })

  it('già raggiunto: indica la media minima', () => {
    const msg = describe_(goal(22))!
    expect(msg).toMatchObject({ status: 'reached', title: 'Già raggiunto', tone: 'info' })
    // (1560 + 18×60) / 120 = 22
    expect(msg.detail).toBe('Anche prendendo 18 in tutti gli esami rimanenti arriveresti a 22,00.')
  })

  it('senza esami futuri: media finale già determinata', () => {
    expect(describe_({ futureExams: [], ...goal(26) })!.detail).toBe(
      'Con questi voti la tua media finale è 26,00.',
    )
    expect(describe_({ futureExams: [], ...goal(27) })!.detail).toMatch(/sotto l’obiettivo/)
  })
})
