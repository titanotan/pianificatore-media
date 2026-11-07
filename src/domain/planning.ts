import { MAX_GRADE, MIN_GRADE, TIGHT_THRESHOLD } from './types'

/** Tolleranza per i confronti tra numeri decimali (evita errori tipo 27.999999999). */
export const EPSILON = 1e-9

/**
 * Stato dell'obiettivo:
 * - reached     già raggiunto: ci arrivi anche prendendo 18 in tutti gli esami rimasti
 * - reachable   raggiungibile con una media sotto la soglia "al limite"
 * - tight       al limite: serve una media tra 29 e 30
 * - lode-only   serve più di 30 di media: possibile solo con delle lodi
 * - impossible  non raggiungibile nemmeno con il massimo in tutti gli esami
 */
export type GoalStatus = 'reached' | 'reachable' | 'tight' | 'lode-only' | 'impossible'

export interface GoalInput {
  /** Media obiettivo */
  goal: number
  /** Σ (voto × CFU) degli esami con voto già certo (sostenuti + bloccati) */
  fixedSum: number
  /** CFU degli esami con voto già certo */
  fixedCfu: number
  /** CFU degli esami ancora "liberi" (futuri non bloccati) */
  freeCfu: number
  /** Valore della lode: è il massimo ottenibile in un singolo esame */
  lodeValue: number
}

export interface GoalEvaluation {
  status: GoalStatus
  /** Media necessaria negli esami liberi; `null` se non ci sono esami liberi */
  required: number | null
  /** Media finale se tutti gli esami liberi prendessero 18 */
  minFinal: number
  /** Media finale se tutti gli esami liberi prendessero 30 (senza lode) */
  maxFinalWithoutLode: number
  /** Media finale se tutti gli esami liberi prendessero 30 e lode */
  maxFinal: number
}

/**
 * Media necessaria negli esami liberi per arrivare all'obiettivo:
 * (obiettivo × CFU totali − Σ voti certi) / CFU liberi
 */
export function requiredAverage(
  goal: number,
  fixedSum: number,
  fixedCfu: number,
  freeCfu: number,
): number {
  if (freeCfu <= 0) throw new RangeError('Servono CFU liberi per calcolare la media necessaria')
  return (goal * (fixedCfu + freeCfu) - fixedSum) / freeCfu
}

function finalAverageWith(input: GoalInput, gradeOnFree: number): number {
  const totalCfu = input.fixedCfu + input.freeCfu
  return (input.fixedSum + gradeOnFree * input.freeCfu) / totalCfu
}

/** Valuta l'obiettivo; `null` se non ci sono esami (né sostenuti né futuri). */
export function evaluateGoal(input: GoalInput): GoalEvaluation | null {
  const totalCfu = input.fixedCfu + input.freeCfu
  if (totalCfu <= 0) return null

  const minFinal = finalAverageWith(input, MIN_GRADE)
  const maxFinalWithoutLode = finalAverageWith(input, MAX_GRADE)
  const maxFinal = finalAverageWith(input, Math.max(input.lodeValue, MAX_GRADE))
  const bounds = { minFinal, maxFinalWithoutLode, maxFinal }

  // Nessun esame libero: la media finale è già determinata.
  if (input.freeCfu <= 0) {
    const final = input.fixedSum / input.fixedCfu
    const status: GoalStatus = final >= input.goal - EPSILON ? 'reached' : 'impossible'
    return { status, required: null, ...bounds }
  }

  const required = requiredAverage(input.goal, input.fixedSum, input.fixedCfu, input.freeCfu)
  return { status: statusForRequired(required, input.lodeValue), required, ...bounds }
}

export function statusForRequired(required: number, lodeValue: number): GoalStatus {
  if (required <= MIN_GRADE + EPSILON) return 'reached'
  if (required < TIGHT_THRESHOLD - EPSILON) return 'reachable'
  if (required <= MAX_GRADE + EPSILON) return 'tight'
  if (required <= lodeValue + EPSILON) return 'lode-only'
  return 'impossible'
}

/**
 * Avanzamento verso l'obiettivo per la barra (0–1), misurato da 18 (minimo) all'obiettivo.
 * `null` se manca la media o l'obiettivo.
 */
export function goalProgress(average: number | null, goal: number | null): number | null {
  if (average === null || goal === null) return null
  if (goal <= MIN_GRADE) return 1
  const ratio = (average - MIN_GRADE) / (goal - MIN_GRADE)
  return Math.min(1, Math.max(0, ratio))
}
