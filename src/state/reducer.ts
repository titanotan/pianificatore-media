/**
 * Tutte le modifiche ai dati passano da qui (funzione pura, testata).
 * I dati in ingresso sono già validati dai moduli; il reducer garantisce solo la coerenza
 * (es. niente lode senza 30, niente voti previsti per esami eliminati).
 */
import {
  MAX_GRADE,
  createEmptyData,
  type AppData,
  type FutureExam,
  type Goal,
  type PassedExam,
  type Prediction,
  type Scenario,
  type Settings,
} from '../domain/types'

export type AppAction =
  | { type: 'passed/add'; exam: PassedExam }
  | { type: 'passed/update'; exam: PassedExam }
  | { type: 'passed/remove'; id: string }
  | { type: 'future/add'; exam: FutureExam }
  | { type: 'future/update'; exam: FutureExam }
  | { type: 'future/remove'; id: string }
  | { type: 'settings/update'; settings: Partial<Settings> }
  | { type: 'goal/set'; goal: Goal }
  | { type: 'goal/clear' }
  | { type: 'prediction/set'; examId: string; grade: number; lode: boolean }
  | { type: 'prediction/clear'; examId: string }
  | { type: 'prediction/setLocked'; examId: string; locked: boolean }
  | { type: 'data/replace'; data: AppData }
  | { type: 'data/reset' }

const withLodeRule = <T extends { grade: number; lode: boolean }>(item: T): T =>
  item.lode && item.grade !== MAX_GRADE ? { ...item, lode: false } : item

function replaceById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : list
}

/** Applica una modifica alle previsioni dello scenario attivo. */
function updateActivePredictions(
  state: AppData,
  update: (predictions: Record<string, Prediction>) => Record<string, Prediction>,
): AppData {
  return {
    ...state,
    scenarios: state.scenarios.map((scenario) =>
      scenario.id === state.activeScenarioId
        ? { ...scenario, predictions: update(scenario.predictions) }
        : scenario,
    ),
  }
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record
  const copy = { ...record }
  delete copy[key]
  return copy
}

export function appReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'passed/add':
      return { ...state, passedExams: [...state.passedExams, withLodeRule(action.exam)] }

    case 'passed/update':
      return { ...state, passedExams: replaceById(state.passedExams, withLodeRule(action.exam)) }

    case 'passed/remove':
      return { ...state, passedExams: state.passedExams.filter((e) => e.id !== action.id) }

    case 'future/add':
      return { ...state, futureExams: [...state.futureExams, action.exam] }

    case 'future/update':
      return { ...state, futureExams: replaceById(state.futureExams, action.exam) }

    case 'future/remove':
      // Rimuove anche i voti previsti per quell'esame, in tutti gli scenari
      return {
        ...state,
        futureExams: state.futureExams.filter((e) => e.id !== action.id),
        scenarios: state.scenarios.map((scenario): Scenario => ({
          ...scenario,
          predictions: withoutKey(scenario.predictions, action.id),
        })),
      }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.settings } }

    case 'goal/set':
      return { ...state, goal: action.goal }

    case 'goal/clear':
      return { ...state, goal: null }

    case 'prediction/set': {
      if (!state.futureExams.some((e) => e.id === action.examId)) return state
      return updateActivePredictions(state, (predictions) => ({
        ...predictions,
        [action.examId]: withLodeRule({
          grade: action.grade,
          lode: action.lode,
          locked: predictions[action.examId]?.locked ?? false,
        }),
      }))
    }

    case 'prediction/clear':
      return updateActivePredictions(state, (predictions) => withoutKey(predictions, action.examId))

    case 'prediction/setLocked':
      return updateActivePredictions(state, (predictions) => {
        const current = predictions[action.examId]
        // Si può bloccare solo un esame che ha già un voto previsto
        if (!current || current.locked === action.locked) return predictions
        return { ...predictions, [action.examId]: { ...current, locked: action.locked } }
      })

    case 'data/replace':
      return action.data

    case 'data/reset':
      return createEmptyData()
  }
}

/** Scenario attivo (con ripiego sul primo, per sicurezza). */
export function getActiveScenario(state: AppData): Scenario {
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? state.scenarios[0]
}
