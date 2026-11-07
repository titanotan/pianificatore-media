import { MAX_GRADE, type PassedExam, type Settings } from './types'

/** Voto usato nella media: con la lode un 30 vale quanto impostato dall'utente. */
export function effectiveGrade(grade: number, lode: boolean, lodeValue: number): number {
  return lode && grade === MAX_GRADE ? lodeValue : grade
}

export interface WeightedItem {
  cfu: number
  value: number
}

/** Somma dei voti pesati per i CFU e totale dei CFU. */
export function weightedTotals(items: readonly WeightedItem[]): { sum: number; cfu: number } {
  let sum = 0
  let cfu = 0
  for (const item of items) {
    sum += item.value * item.cfu
    cfu += item.cfu
  }
  return { sum, cfu }
}

/** Media ponderata sui CFU; `null` se non ci sono CFU (nessun esame). */
export function weightedAverage(items: readonly WeightedItem[]): number | null {
  const { sum, cfu } = weightedTotals(items)
  return cfu > 0 ? sum / cfu : null
}

export interface PassedSummary {
  count: number
  cfu: number
  /** Σ (voto effettivo × CFU) */
  weightedSum: number
  average: number | null
}

/** Riepilogo del libretto: numero di esami, CFU e media ponderata attuale. */
export function summarizePassedExams(
  exams: readonly PassedExam[],
  settings: Settings,
): PassedSummary {
  const { sum, cfu } = weightedTotals(
    exams.map((exam) => ({
      cfu: exam.cfu,
      value: effectiveGrade(exam.grade, exam.lode, settings.lodeValue),
    })),
  )
  return { count: exams.length, cfu, weightedSum: sum, average: cfu > 0 ? sum / cfu : null }
}
