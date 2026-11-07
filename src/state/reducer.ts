/**
 * Tutte le modifiche ai dati passano da qui (funzione pura, testata).
 * I dati in ingresso sono già validati dai moduli; il reducer garantisce solo la coerenza
 * (es. niente lode senza 30, niente voti previsti per esami eliminati).
 */
import { activeScenarioOf, nextActiveAfterRemoval } from '../domain/scenarios'
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
  type PlanningScope,
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
  // Obiettivi e voti previsti: `scope` dice se sono della media generale o del gruppo
  | { type: 'scenario/add'; scope: PlanningScope; scenario: Scenario }
  | { type: 'scenario/updateGoal'; scope: PlanningScope; id: string; goal: Goal }
  | { type: 'scenario/remove'; scope: PlanningScope; id: string }
  | { type: 'scenario/select'; scope: PlanningScope; id: string }
  | {
      type: 'prediction/set'
      scope: PlanningScope
      scenarioId: string
      examId: string
      grade: number
      lode: boolean
    }
  | { type: 'prediction/clear'; scope: PlanningScope; scenarioId: string; examId: string }
  | {
      type: 'prediction/setLocked'
      scope: PlanningScope
      scenarioId: string
      examId: string
      locked: boolean
    }
  | { type: 'prediction/clearAll'; scope: PlanningScope; scenarioId: string }
  | { type: 'data/replace'; data: AppData }
  | { type: 'data/reset' }

const withLodeRule = <T extends { grade: number; lode: boolean }>(item: T): T =>
  item.lode && item.grade !== MAX_GRADE ? { ...item, lode: false } : item

function replaceById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : list
}

interface ScopeState {
  scenarios: Scenario[]
  activeScenarioId: string | null
}

/** Applica una modifica a obiettivi e selezione di un ambito (generale o gruppo). */
function updateScope(
  state: AppData,
  scope: PlanningScope,
  update: (current: ScopeState) => ScopeState,
): AppData {
  if (scope === 'group') {
    const { scenarios, activeScenarioId } = update(state.group)
    return { ...state, group: { ...state.group, scenarios, activeScenarioId } }
  }
  const { scenarios, activeScenarioId } = update(state)
  return { ...state, scenarios, activeScenarioId }
}

/** Applica una modifica alle previsioni di uno scenario. */
function updatePredictions(
  state: AppData,
  scope: PlanningScope,
  scenarioId: string,
  update: (predictions: Record<string, Prediction>) => Record<string, Prediction>,
): AppData {
  return updateScope(state, scope, (current) => ({
    ...current,
    scenarios: current.scenarios.map((scenario) =>
      scenario.id === scenarioId
        ? { ...scenario, predictions: update(scenario.predictions) }
        : scenario,
    ),
  }))
}

const removePredictionsFor = (scenarios: Scenario[], examId: string): Scenario[] =>
  scenarios.map((scenario) => ({
    ...scenario,
    predictions: withoutKey(scenario.predictions, examId),
  }))

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
      // Rimuove anche i voti previsti per quell'esame, in tutti gli obiettivi (generali e del gruppo)
      return {
        ...state,
        futureExams: state.futureExams.filter((e) => e.id !== action.id),
        scenarios: removePredictionsFor(state.scenarios, action.id),
        group: {
          ...state.group,
          scenarios: removePredictionsFor(state.group.scenarios, action.id),
        },
      }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.settings } }

    case 'group/update':
      return { ...state, group: { ...state.group, ...action.group } }

    case 'scenario/add':
      return updateScope(state, action.scope, (current) => {
        if (current.scenarios.length >= MAX_SCENARIOS) return current
        const scenario = {
          ...action.scenario,
          predictions: keepExisting(state, action.scenario.predictions),
        }
        return { scenarios: [...current.scenarios, scenario], activeScenarioId: scenario.id }
      })

    case 'scenario/updateGoal':
      return updateScope(state, action.scope, (current) => ({
        ...current,
        scenarios: current.scenarios.map((s) =>
          s.id === action.id ? { ...s, goal: action.goal } : s,
        ),
      }))

    case 'scenario/remove':
      return updateScope(state, action.scope, (current) => {
        if (!current.scenarios.some((s) => s.id === action.id)) return current
        return {
          scenarios: current.scenarios.filter((s) => s.id !== action.id),
          activeScenarioId:
            current.activeScenarioId === action.id
              ? nextActiveAfterRemoval(current.scenarios, action.id)
              : current.activeScenarioId,
        }
      })

    case 'scenario/select':
      return updateScope(state, action.scope, (current) =>
        current.scenarios.some((s) => s.id === action.id)
          ? { ...current, activeScenarioId: action.id }
          : current,
      )

    case 'prediction/set': {
      if (!state.futureExams.some((e) => e.id === action.examId)) return state
      return updatePredictions(state, action.scope, action.scenarioId, (predictions) => ({
        ...predictions,
        [action.examId]: withLodeRule({
          grade: action.grade,
          lode: action.lode,
          locked: predictions[action.examId]?.locked ?? false,
        }),
      }))
    }

    case 'prediction/clear':
      return updatePredictions(state, action.scope, action.scenarioId, (predictions) =>
        withoutKey(predictions, action.examId),
      )

    case 'prediction/clearAll':
      return updatePredictions(state, action.scope, action.scenarioId, () => ({}))

    case 'prediction/setLocked':
      return updatePredictions(state, action.scope, action.scenarioId, (predictions) => {
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

/** Obiettivo generale selezionato (con ripiego sul primo); `null` se non ci sono obiettivi. */
export function getActiveScenario(state: AppData): Scenario | null {
  return activeScenarioOf(state)
}
