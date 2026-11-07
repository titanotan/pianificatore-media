/**
 * Più obiettivi: ogni obiettivo è uno scenario con la sua simulazione.
 * Qui le funzioni per calcolarli, confrontarli e crearne di nuovi.
 */
import { formatAverage } from './format'
import { summarizePassedExams } from './grades'
import { EPSILON } from './planning'
import { computePlan, type Plan } from './simulation'
import { MAX_GRADE, MAX_SCENARIOS, MIN_GRADE, type AppData, type Scenario } from './types'
import { validateGoalAverage } from './validation'

export interface ScenarioPlan {
  scenario: Scenario
  plan: Plan
}

/** Calcolo completo della pianificazione per uno scenario. */
export function planForScenario(data: AppData, scenario: Scenario | null): Plan {
  return computePlan({
    passedExams: data.passedExams,
    futureExams: data.futureExams,
    predictions: scenario?.predictions ?? {},
    settings: data.settings,
    goal: scenario?.goal ?? null,
  })
}

/** Tutti gli obiettivi con il loro calcolo, ordinati per media obiettivo crescente. */
export function planAllScenarios(data: AppData): ScenarioPlan[] {
  return sortScenarios(data.scenarios).map((scenario) => ({
    scenario,
    plan: planForScenario(data, scenario),
  }))
}

export function sortScenarios(scenarios: readonly Scenario[]): Scenario[] {
  return [...scenarios].sort((a, b) => a.goal.value - b.goal.value)
}

export function findScenario(data: AppData, id: string | null): Scenario | null {
  return data.scenarios.find((s) => s.id === id) ?? null
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
export function reachableRange(data: AppData): ReachableRange | null {
  const passed = summarizePassedExams(data.passedExams, data.settings)
  const futureCfu = data.futureExams.reduce((sum, exam) => sum + exam.cfu, 0)
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

export function canAddScenario(data: AppData): boolean {
  return data.scenarios.length < MAX_SCENARIOS
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
