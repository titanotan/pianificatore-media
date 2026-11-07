import { describe, expect, it } from 'vitest'
import { createEmptyData, type AppData } from '../domain/types'
import { appReducer, getActiveScenario, type AppAction } from './reducer'

const run = (actions: AppAction[], start: AppData = createEmptyData()) =>
  actions.reduce(appReducer, start)

const withFuture = () =>
  run([
    { type: 'future/add', exam: { id: 'f1', name: 'Fisica', cfu: 12, difficulty: 'hard' } },
    { type: 'future/add', exam: { id: 'f2', name: 'Basi di dati', cfu: 6, difficulty: 'easy' } },
  ])

describe('esami sostenuti', () => {
  it('aggiunge, modifica ed elimina', () => {
    let state = run([
      { type: 'passed/add', exam: { id: 'a', name: 'Analisi', cfu: 9, grade: 27, lode: false } },
      { type: 'passed/add', exam: { id: 'b', name: 'Fisica', cfu: 6, grade: 25, lode: false } },
    ])
    expect(state.passedExams).toHaveLength(2)

    state = appReducer(state, {
      type: 'passed/update',
      exam: { id: 'a', name: 'Analisi I', cfu: 9, grade: 30, lode: true },
    })
    expect(state.passedExams[0]).toMatchObject({ name: 'Analisi I', grade: 30, lode: true })

    state = appReducer(state, { type: 'passed/remove', id: 'a' })
    expect(state.passedExams.map((e) => e.id)).toEqual(['b'])
  })

  it('toglie la lode se il voto non è 30', () => {
    const state = run([
      { type: 'passed/add', exam: { id: 'a', name: 'A', cfu: 6, grade: 28, lode: true } },
    ])
    expect(state.passedExams[0].lode).toBe(false)
  })

  it('modificare un esame inesistente non cambia nulla', () => {
    const start = createEmptyData()
    const state = appReducer(start, {
      type: 'passed/update',
      exam: { id: 'x', name: 'X', cfu: 6, grade: 18, lode: false },
    })
    expect(state.passedExams).toEqual([])
  })
})

const goal = (value: number) => ({ kind: 'average' as const, value })
const scenario = (id: string, value: number, predictions = {}) => ({
  id,
  name: '',
  goal: goal(value),
  predictions,
})

/** Esami futuri f1, f2 e due obiettivi: s25 e s27 (selezionato). */
const withGoals = () =>
  run(
    [
      { type: 'scenario/add', scenario: scenario('s25', 25) },
      { type: 'scenario/add', scenario: scenario('s27', 27) },
    ],
    withFuture(),
  )

const predictionsOf = (state: AppData, id: string) =>
  state.scenarios.find((s) => s.id === id)!.predictions

describe('obiettivi (scenari)', () => {
  it('aggiunge un obiettivo e lo seleziona', () => {
    const state = withGoals()
    expect(state.scenarios.map((s) => s.id)).toEqual(['s25', 's27'])
    expect(state.activeScenarioId).toBe('s27')
    expect(getActiveScenario(state)!.goal.value).toBe(27)
  })

  it('seleziona un obiettivo esistente, ignora id sconosciuti', () => {
    let state = appReducer(withGoals(), { type: 'scenario/select', id: 's25' })
    expect(state.activeScenarioId).toBe('s25')
    state = appReducer(state, { type: 'scenario/select', id: 'nope' })
    expect(state.activeScenarioId).toBe('s25')
  })

  it('modifica la media di un obiettivo', () => {
    const state = appReducer(withGoals(), {
      type: 'scenario/updateGoal',
      id: 's25',
      goal: goal(26),
    })
    expect(state.scenarios[0].goal.value).toBe(26)
  })

  it('eliminando l’obiettivo selezionato ne seleziona un altro', () => {
    let state = appReducer(withGoals(), { type: 'scenario/remove', id: 's27' })
    expect(state.scenarios.map((s) => s.id)).toEqual(['s25'])
    expect(state.activeScenarioId).toBe('s25')
    state = appReducer(state, { type: 'scenario/remove', id: 's25' })
    expect(state.scenarios).toEqual([])
    expect(state.activeScenarioId).toBeNull()
    expect(getActiveScenario(state)).toBeNull()
  })

  it('eliminando un obiettivo non selezionato la selezione resta', () => {
    const state = appReducer(withGoals(), { type: 'scenario/remove', id: 's25' })
    expect(state.activeScenarioId).toBe('s27')
  })

  it('copiando i voti previsti tiene solo quelli di esami esistenti', () => {
    const state = appReducer(withFuture(), {
      type: 'scenario/add',
      scenario: scenario('s', 26, {
        f1: { grade: 28, lode: false, locked: true },
        sparito: { grade: 30, lode: false, locked: false },
      }),
    })
    expect(Object.keys(predictionsOf(state, 's'))).toEqual(['f1'])
  })

  it('non supera il numero massimo di obiettivi', () => {
    let state = withFuture()
    for (let i = 0; i < 12; i++) {
      state = appReducer(state, { type: 'scenario/add', scenario: scenario(`s${i}`, 18 + i) })
    }
    expect(state.scenarios).toHaveLength(10)
  })
})

describe('esami futuri e voti previsti', () => {
  it('assegna, blocca e sblocca un voto previsto', () => {
    let state = appReducer(withGoals(), {
      type: 'prediction/set',
      scenarioId: 's27',
      examId: 'f1',
      grade: 27,
      lode: false,
    })
    expect(predictionsOf(state, 's27').f1).toEqual({ grade: 27, lode: false, locked: false })

    state = appReducer(state, {
      type: 'prediction/setLocked',
      scenarioId: 's27',
      examId: 'f1',
      locked: true,
    })
    expect(predictionsOf(state, 's27').f1.locked).toBe(true)

    // Cambiare il voto mantiene il blocco
    state = appReducer(state, {
      type: 'prediction/set',
      scenarioId: 's27',
      examId: 'f1',
      grade: 29,
      lode: false,
    })
    expect(predictionsOf(state, 's27').f1).toEqual({ grade: 29, lode: false, locked: true })

    state = appReducer(state, {
      type: 'prediction/setLocked',
      scenarioId: 's27',
      examId: 'f1',
      locked: false,
    })
    expect(predictionsOf(state, 's27').f1.locked).toBe(false)
  })

  it('ogni obiettivo ha la sua simulazione indipendente', () => {
    const state = run(
      [
        { type: 'prediction/set', scenarioId: 's25', examId: 'f1', grade: 24, lode: false },
        { type: 'prediction/set', scenarioId: 's27', examId: 'f1', grade: 30, lode: true },
      ],
      withGoals(),
    )
    expect(predictionsOf(state, 's25').f1.grade).toBe(24)
    expect(predictionsOf(state, 's27').f1).toEqual({ grade: 30, lode: true, locked: false })
  })

  it('non si può bloccare un esame senza voto previsto', () => {
    const state = appReducer(withGoals(), {
      type: 'prediction/setLocked',
      scenarioId: 's27',
      examId: 'f1',
      locked: true,
    })
    expect(predictionsOf(state, 's27').f1).toBeUndefined()
  })

  it('ignora voti previsti per esami inesistenti', () => {
    const start = withGoals()
    const state = appReducer(start, {
      type: 'prediction/set',
      scenarioId: 's27',
      examId: 'nope',
      grade: 30,
      lode: false,
    })
    expect(state).toBe(start)
  })

  it('toglie la lode prevista se il voto non è 30', () => {
    const state = appReducer(withGoals(), {
      type: 'prediction/set',
      scenarioId: 's27',
      examId: 'f1',
      grade: 29,
      lode: true,
    })
    expect(predictionsOf(state, 's27').f1.lode).toBe(false)
  })

  it('cancella un voto previsto o tutta la simulazione', () => {
    let state = run(
      [
        { type: 'prediction/set', scenarioId: 's27', examId: 'f1', grade: 27, lode: false },
        { type: 'prediction/set', scenarioId: 's27', examId: 'f2', grade: 28, lode: false },
      ],
      withGoals(),
    )
    state = appReducer(state, { type: 'prediction/clear', scenarioId: 's27', examId: 'f1' })
    expect(Object.keys(predictionsOf(state, 's27'))).toEqual(['f2'])
    state = appReducer(state, { type: 'prediction/clearAll', scenarioId: 's27' })
    expect(predictionsOf(state, 's27')).toEqual({})
  })

  it('eliminando un esame futuro elimina i suoi voti previsti in tutti gli obiettivi', () => {
    let state = run(
      [
        { type: 'prediction/set', scenarioId: 's25', examId: 'f1', grade: 27, lode: false },
        { type: 'prediction/set', scenarioId: 's27', examId: 'f1', grade: 29, lode: false },
        { type: 'prediction/set', scenarioId: 's27', examId: 'f2', grade: 30, lode: true },
      ],
      withGoals(),
    )
    state = appReducer(state, { type: 'future/remove', id: 'f1' })
    expect(state.futureExams.map((e) => e.id)).toEqual(['f2'])
    expect(predictionsOf(state, 's25')).toEqual({})
    expect(Object.keys(predictionsOf(state, 's27'))).toEqual(['f2'])
  })

  it('modifica un esame futuro', () => {
    const state = appReducer(withFuture(), {
      type: 'future/update',
      exam: { id: 'f2', name: 'Basi di dati', cfu: 9, difficulty: 'medium' },
    })
    expect(state.futureExams[1]).toMatchObject({ cfu: 9, difficulty: 'medium' })
  })
})

describe('impostazioni e reset', () => {
  it('aggiorna il valore della lode', () => {
    const state = appReducer(createEmptyData(), {
      type: 'settings/update',
      settings: { lodeValue: 32 },
    })
    expect(state.settings.lodeValue).toBe(32)
  })

  it('reset: torna ai dati vuoti', () => {
    const state = appReducer(withGoals(), { type: 'data/reset' })
    expect(state).toEqual(createEmptyData())
  })

  it('non modifica mai lo stato precedente', () => {
    const start = withGoals()
    const snapshot = JSON.stringify(start)
    appReducer(start, {
      type: 'prediction/set',
      scenarioId: 's27',
      examId: 'f1',
      grade: 27,
      lode: false,
    })
    appReducer(start, { type: 'future/remove', id: 'f1' })
    appReducer(start, { type: 'scenario/remove', id: 's27' })
    expect(JSON.stringify(start)).toBe(snapshot)
  })
})
