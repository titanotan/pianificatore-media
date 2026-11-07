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

const predictions = (state: AppData) => getActiveScenario(state).predictions

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

describe('esami futuri e voti previsti', () => {
  it('assegna, blocca e sblocca un voto previsto', () => {
    let state = appReducer(withFuture(), {
      type: 'prediction/set',
      examId: 'f1',
      grade: 27,
      lode: false,
    })
    expect(predictions(state).f1).toEqual({ grade: 27, lode: false, locked: false })

    state = appReducer(state, { type: 'prediction/setLocked', examId: 'f1', locked: true })
    expect(predictions(state).f1.locked).toBe(true)

    // Cambiare il voto mantiene il blocco
    state = appReducer(state, { type: 'prediction/set', examId: 'f1', grade: 29, lode: false })
    expect(predictions(state).f1).toEqual({ grade: 29, lode: false, locked: true })

    state = appReducer(state, { type: 'prediction/setLocked', examId: 'f1', locked: false })
    expect(predictions(state).f1.locked).toBe(false)
  })

  it('non si può bloccare un esame senza voto previsto', () => {
    const start = withFuture()
    const state = appReducer(start, { type: 'prediction/setLocked', examId: 'f1', locked: true })
    expect(predictions(state).f1).toBeUndefined()
  })

  it('ignora voti previsti per esami inesistenti', () => {
    const start = withFuture()
    const state = appReducer(start, {
      type: 'prediction/set',
      examId: 'nope',
      grade: 30,
      lode: false,
    })
    expect(state).toBe(start)
  })

  it('toglie la lode prevista se il voto non è 30', () => {
    const state = appReducer(withFuture(), {
      type: 'prediction/set',
      examId: 'f1',
      grade: 29,
      lode: true,
    })
    expect(predictions(state).f1.lode).toBe(false)
  })

  it('cancella un voto previsto', () => {
    let state = appReducer(withFuture(), {
      type: 'prediction/set',
      examId: 'f1',
      grade: 27,
      lode: false,
    })
    state = appReducer(state, { type: 'prediction/clear', examId: 'f1' })
    expect(predictions(state)).toEqual({})
  })

  it('eliminando un esame futuro elimina anche il suo voto previsto', () => {
    let state = run(
      [
        { type: 'prediction/set', examId: 'f1', grade: 27, lode: false },
        { type: 'prediction/set', examId: 'f2', grade: 30, lode: true },
      ],
      withFuture(),
    )
    state = appReducer(state, { type: 'future/remove', id: 'f1' })
    expect(state.futureExams.map((e) => e.id)).toEqual(['f2'])
    expect(Object.keys(predictions(state))).toEqual(['f2'])
  })

  it('modifica un esame futuro', () => {
    const state = appReducer(withFuture(), {
      type: 'future/update',
      exam: { id: 'f2', name: 'Basi di dati', cfu: 9, difficulty: 'medium' },
    })
    expect(state.futureExams[1]).toMatchObject({ cfu: 9, difficulty: 'medium' })
  })
})

describe('impostazioni, obiettivo e reset', () => {
  it('aggiorna il valore della lode', () => {
    const state = appReducer(createEmptyData(), {
      type: 'settings/update',
      settings: { lodeValue: 32 },
    })
    expect(state.settings.lodeValue).toBe(32)
  })

  it('imposta e rimuove l’obiettivo', () => {
    let state = appReducer(createEmptyData(), {
      type: 'goal/set',
      goal: { kind: 'average', value: 28 },
    })
    expect(state.goal).toEqual({ kind: 'average', value: 28 })
    state = appReducer(state, { type: 'goal/clear' })
    expect(state.goal).toBeNull()
  })

  it('reset: torna ai dati vuoti', () => {
    const state = appReducer(withFuture(), { type: 'data/reset' })
    expect(state).toEqual(createEmptyData())
  })

  it('non modifica mai lo stato precedente', () => {
    const start = withFuture()
    const snapshot = JSON.stringify(start)
    appReducer(start, { type: 'prediction/set', examId: 'f1', grade: 27, lode: false })
    appReducer(start, { type: 'future/remove', id: 'f1' })
    expect(JSON.stringify(start)).toBe(snapshot)
  })
})
