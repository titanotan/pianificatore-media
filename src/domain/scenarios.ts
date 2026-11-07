/**
 * Più obiettivi: ogni obiettivo è uno scenario con la sua simulazione.
 * Qui le funzioni per calcolarli, confrontarli e crearne di nuovi.
 *
 * Tutto funziona per "ambito": la media generale (`main`, tutti gli esami) oppure
 * il gruppo di esami (`group`, solo gli esami del gruppo, con obiettivi propri).
 */
import { formatAverage } from './format'
import { summarizePassedExams } from './grades'
import { EPSILON } from './planning'
import { computePlan, type Plan } from './simulation'
import { groupExams } from './group'
import {
  MAX_GRADE,
  MAX_SCENARIOS,
  MIN_GRADE,
  type AppData,
  type FutureExam,
  type PassedExam,
  type PlanningScope,
  type Scenario,
} from './types'
import { validateGoalAverage } from './validation'

export interface ScenarioPlan {
  scenario: Scenario
  plan: Plan
}

export interface ScopeData {
  passedExams: PassedExam[]
  futureExams: FutureExam[]
  scenarios: Scenario[]
  activeScenarioId: string | null
}

/** Esami e obiettivi di un ambito. */
export function scopeData(data: AppData, scope: PlanningScope): ScopeData {
  if (scope === 'group') {
    const { passed, future } = groupExams(data)
    return {
      passedExams: passed,
      futureExams: future,
      scenarios: data.group.scenarios,
      activeScenarioId: data.group.activeScenarioId,
    }
  }
  return {
    passedExams: data.passedExams,
    futureExams: data.futureExams,
    scenarios: data.scenarios,
    activeScenarioId: data.activeScenarioId,
  }
}

/** Obiettivo selezionato di un ambito (con ripiego sul primo); `null` se non ce ne sono. */
export function activeScenarioOf(scope: Pick<ScopeData, 'scenarios' | 'activeScenarioId'>) {
  return scope.scenarios.find((s) => s.id === scope.activeScenarioId) ?? scope.scenarios[0] ?? null
}

/** Calcolo completo della pianificazione per uno scenario di un ambito. */
export function planForScenario(
  data: AppData,
  scenario: Scenario | null,
  scope: PlanningScope = 'main',
): Plan {
  const { passedExams, futureExams } = scopeData(data, scope)
  return computePlan({
    passedExams,
    futureExams,
    predictions: scenario?.predictions ?? {},
    settings: data.settings,
    goal: scenario?.goal ?? null,
  })
}

/** Tutti gli obiettivi di un ambito con il loro calcolo, ordinati per media crescente. */
export function planAllScenarios(data: AppData, scope: PlanningScope = 'main'): ScenarioPlan[] {
  return sortScenarios(scopeData(data, scope).scenarios).map((scenario) => ({
    scenario,
    plan: planForScenario(data, scenario, scope),
  }))
}

export function sortScenarios(scenarios: readonly Scenario[]): Scenario[] {
  return [...scenarios].sort((a, b) => a.goal.value - b.goal.value)
}

/** Nome da mostrare: il nome se c'è, altrimenti "Media 26,00". */
export function scenarioLabel(scenario: Scenario): string {
  return scenario.name.trim() || `Media ${formatAverage(scenario.goal.value)}`
}

export interface ReachableRange {
  /** Media finale con 18 in tutti gli esami futuri */
  min: number
  /** Media finale con 30 in tutti gli esami futuri */
  max: number
  /** Media finale con 30 e lode in tutti gli esami futuri */
  maxWithLode: number
}

/**
 * Medie finali raggiungibili, indipendentemente dagli obiettivi e dalle simulazioni.
 * `null` se non ci sono esami.
 */
export function reachableRange(
  data: AppData,
  scope: PlanningScope = 'main',
): ReachableRange | null {
  const { passedExams, futureExams } = scopeData(data, scope)
  const passed = summarizePassedExams(passedExams, data.settings)
  const futureCfu = futureExams.reduce((sum, exam) => sum + exam.cfu, 0)
  const totalCfu = passed.cfu + futureCfu
  if (totalCfu === 0) return null
  const withGrade = (grade: number) => (passed.weightedSum + grade * futureCfu) / totalCfu
  return {
    min: withGrade(MIN_GRADE),
    max: withGrade(MAX_GRADE),
    maxWithLode: withGrade(Math.max(MAX_GRADE, data.settings.lodeValue)),
  }
}

/**
 * Obiettivi suggeriti per crearne uno al volo: le medie intere sopra quella attuale
 * (es. media 24,3 → 25, 26, 27, 28), escluse quelle già presenti.
 */
export function suggestGoals(
  currentAverage: number | null,
  existing: readonly number[],
  count = 4,
): number[] {
  const start =
    currentAverage === null ? 25 : Math.min(MAX_GRADE, Math.floor(currentAverage + EPSILON) + 1)
  const suggestions: number[] = []
  for (let value = start; value <= MAX_GRADE && suggestions.length < count; value++) {
    if (!existing.some((e) => Math.abs(e - value) < EPSILON)) suggestions.push(value)
  }
  return suggestions
}

/**
 * Valida la media di un obiettivo, controllando anche che non esista già
 * (`excludeId`: l'obiettivo che si sta modificando).
 */
export function validateScenarioGoal(
  raw: string,
  scenarios: readonly Scenario[],
  excludeId?: string,
): { value: number; error?: undefined } | { value?: undefined; error: string } {
  const result = validateGoalAverage(raw)
  if (result.value === undefined) return result
  const duplicate = scenarios.some(
    (s) => s.id !== excludeId && Math.abs(s.goal.value - result.value) < EPSILON,
  )
  if (duplicate) {
    return { error: `Hai già un obiettivo con media ${formatAverage(result.value)}.` }
  }
  return result
}

export function canAddScenario(scenarios: readonly Scenario[]): boolean {
  return scenarios.length < MAX_SCENARIOS
}

/** Scenario da selezionare dopo averne eliminato uno: il vicino nella lista ordinata. */
export function nextActiveAfterRemoval(
  scenarios: readonly Scenario[],
  removedId: string,
): string | null {
  const sorted = sortScenarios(scenarios)
  const index = sorted.findIndex((s) => s.id === removedId)
  const remaining = sorted.filter((s) => s.id !== removedId)
  if (remaining.length === 0) return null
  return remaining[Math.min(Math.max(index, 0), remaining.length - 1)].id
}

/** Tutto ciò che serve per mostrare la pianificazione di un ambito. */
export interface ScopeView {
  scope: PlanningScope
  scenarios: Scenario[]
  /** Esami da sostenere dell'ambito (per la simulazione) */
  futureExams: FutureExam[]
  /** Obiettivo selezionato, `null` se non ce ne sono */
  activeScenario: Scenario | null
  /** Calcoli dell'obiettivo selezionato (o solo medie, se non ci sono obiettivi) */
  plan: Plan
  /** Tutti gli obiettivi con i loro calcoli, ordinati per media */
  scenarioPlans: ScenarioPlan[]
  /** Medie finali raggiungibili nell'ambito (indipendenti dagli obiettivi) */
  range: ReachableRange | null
}

export function buildScopeView(data: AppData, scope: PlanningScope): ScopeView {
  const scoped = scopeData(data, scope)
  const activeScenario = activeScenarioOf(scoped)
  return {
    scope,
    scenarios: scoped.scenarios,
    futureExams: scoped.futureExams,
    activeScenario,
    plan: planForScenario(data, activeScenario, scope),
    scenarioPlans: planAllScenarios(data, scope),
    range: reachableRange(data, scope),
  }
}
