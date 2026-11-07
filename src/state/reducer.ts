/**
 * Tutte le modifiche ai dati passano da qui (funzione pura, testata).
 * I dati in ingresso sono già validati dai moduli; il reducer garantisce solo la coerenza
 * (es. niente lode senza 30, niente voti previsti per esami eliminati).
 */
import { nextActiveAfterRemoval } from '../domain/scenarios'
import {
  MAX_GRADE,
  MAX_SCENARIOS,
  createEmptyData,
  type AppData,
  type FutureExam,
  type Goal,
  type PassedExam,
  type Prediction,
  type Scenario,
  type ExamGroup,
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
  | { type: 'group/update'; group: Partial<ExamGroup> }
  | { type: 'scenario/add'; scenario: Scenario }
  | { type: 'scenario/updateGoal'; id: string; goal: Goal }
  | { type: 'scenario/remove'; id: string }
  | { type: 'scenario/select'; id: string }
  | { type: 'prediction/set'; scenarioId: string; examId: string; grade: number; lode: boolean }
  | { type: 'prediction/clear'; scenarioId: string; examId: string }
  | { type: 'prediction/setLocked'; scenarioId: string; examId: string; locked: boolean }
  | { type: 'prediction/clearAll'; scenarioId: string }
  | { type: 'data/replace'; data: AppData }
  | { type: 'data/reset' }

const withLodeRule = <T extends { grade: number; lode: boolean }>(item: T): T =>
  item.lode && item.grade !== MAX_GRADE ? { ...item, lode: false } : item

function replaceById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : list
}

/** Applica una modifica alle previsioni di uno scenario. */
function updatePredictions(
  state: AppData,
  scenarioId: string,
  update: (predictions: Record<string, Prediction>) => Record<string, Prediction>,
): AppData {
  return {
    ...state,
    scenarios: state.scenarios.map((scenario) =>
      scenario.id === scenarioId
        ? { ...scenario, predictions: update(scenario.predictions) }
        : scenario,
    ),
  }
}

/** Tiene solo le previsioni di esami futuri esistenti. */
function keepExisting(state: AppData, predictions: Record<string, Prediction>) {
  const ids = new Set(state.futureExams.map((e) => e.id))
  return Object.fromEntries(Object.entries(predictions).filter(([id]) => ids.has(id)))
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

    case 'group/update':
      return { ...state, group: { ...state.group, ...action.group } }

    case 'scenario/add': {
      if (state.scenarios.length >= MAX_SCENARIOS) return state
      const scenario = {
        ...action.scenario,
        predictions: keepExisting(state, action.scenario.predictions),
      }
      return { ...state, scenarios: [...state.scenarios, scenario], activeScenarioId: scenario.id }
    }

    case 'scenario/updateGoal':
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.id ? { ...s, goal: action.goal } : s,
        ),
      }

    case 'scenario/remove': {
      if (!state.scenarios.some((s) => s.id === action.id)) return state
      return {
        ...state,
        scenarios: state.scenarios.filter((s) => s.id !== action.id),
        activeScenarioId:
          state.activeScenarioId === action.id
            ? nextActiveAfterRemoval(state.scenarios, action.id)
            : state.activeScenarioId,
      }
    }

    case 'scenario/select':
      return state.scenarios.some((s) => s.id === action.id)
        ? { ...state, activeScenarioId: action.id }
        : state

    case 'prediction/set': {
      if (!state.futureExams.some((e) => e.id === action.examId)) return state
      return updatePredictions(state, action.scenarioId, (predictions) => ({
        ...predictions,
        [action.examId]: withLodeRule({
          grade: action.grade,
          lode: action.lode,
          locked: predictions[action.examId]?.locked ?? false,
        }),
      }))
    }

    case 'prediction/clear':
      return updatePredictions(state, action.scenarioId, (predictions) =>
        withoutKey(predictions, action.examId),
      )

    case 'prediction/clearAll':
      return updatePredictions(state, action.scenarioId, () => ({}))

    case 'prediction/setLocked':
      return updatePredictions(state, action.scenarioId, (predictions) => {
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

/** Obiettivo selezionato (con ripiego sul primo); `null` se non ci sono obiettivi. */
export function getActiveScenario(state: AppData): Scenario | null {
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? state.scenarios[0] ?? null
}
