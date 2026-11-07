import { effectiveGrade, summarizePassedExams, type PassedSummary } from './grades'
import { evaluateGoal, type GoalEvaluation } from './planning'
import type { FutureExam, Goal, PassedExam, Prediction, Settings } from './types'

export interface PlanInput {
  passedExams: readonly PassedExam[]
  futureExams: readonly FutureExam[]
  /** Voti previsti dello scenario attivo, per id dell'esame futuro */
  predictions: Readonly<Record<string, Prediction>>
  settings: Settings
  goal: Goal | null
}

export interface FutureSummary {
  count: number
  cfu: number
  /** Esami con voto bloccato: considerati certi nel calcolo della media necessaria */
  lockedCount: number
  lockedCfu: number
  lockedSum: number
  /** Esami non bloccati: su questi si calcola "cosa serve" */
  freeCount: number
  freeCfu: number
  /** Esami con un voto previsto (bloccato o no) */
  predictedCount: number
  predictedCfu: number
}

export interface Projection {
  /** Media finale prevista: esami sostenuti + esami futuri con un voto previsto */
  average: number | null
  /** CFU su cui è calcolata la media prevista */
  cfu: number
  /** true se tutti gli esami futuri hanno un voto previsto (la media prevista è quella finale) */
  complete: boolean
}

export interface Plan {
  passed: PassedSummary
  future: FutureSummary
  /** CFU sostenuti + CFU futuri */
  totalCfu: number
  projection: Projection
  /** Media obiettivo, se impostata */
  goalAverage: number | null
  /** `null` se manca l'obiettivo o non ci sono esami */
  evaluation: GoalEvaluation | null
}

/** Media obiettivo dal tipo di obiettivo (per ora solo media; in futuro altri tipi). */
export function goalToAverage(goal: Goal | null): number | null {
  if (!goal) return null
  switch (goal.kind) {
    case 'average':
      return goal.value
  }
}

/**
 * Calcolo completo della pianificazione:
 * - media attuale sul libretto
 * - media finale prevista con i voti previsti
 * - media necessaria negli esami non bloccati e stato dell'obiettivo
 */
export function computePlan(input: PlanInput): Plan {
  const { lodeValue } = input.settings
  const passed = summarizePassedExams(input.passedExams, input.settings)

  const future: FutureSummary = {
    count: 0,
    cfu: 0,
    lockedCount: 0,
    lockedCfu: 0,
    lockedSum: 0,
    freeCount: 0,
    freeCfu: 0,
    predictedCount: 0,
    predictedCfu: 0,
  }
  let predictedSum = 0

  for (const exam of input.futureExams) {
    future.count += 1
    future.cfu += exam.cfu
    const prediction = input.predictions[exam.id]
    if (prediction) {
      const value = effectiveGrade(prediction.grade, prediction.lode, lodeValue)
      future.predictedCount += 1
      future.predictedCfu += exam.cfu
      predictedSum += value * exam.cfu
      if (prediction.locked) {
        future.lockedCount += 1
        future.lockedCfu += exam.cfu
        future.lockedSum += value * exam.cfu
        continue
      }
    }
    future.freeCount += 1
    future.freeCfu += exam.cfu
  }

  const projectionCfu = passed.cfu + future.predictedCfu
  const projection: Projection = {
    average: projectionCfu > 0 ? (passed.weightedSum + predictedSum) / projectionCfu : null,
    cfu: projectionCfu,
    complete: future.predictedCount === future.count,
  }

  const goalAverage = goalToAverage(input.goal)
  const evaluation =
    goalAverage === null
      ? null
      : evaluateGoal({
          goal: goalAverage,
          fixedSum: passed.weightedSum + future.lockedSum,
          fixedCfu: passed.cfu + future.lockedCfu,
          freeCfu: future.freeCfu,
          lodeValue,
        })

  return {
    passed,
    future,
    totalCfu: passed.cfu + future.cfu,
    projection,
    goalAverage,
    evaluation,
  }
}
