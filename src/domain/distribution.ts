/**
 * Generazione dei voti previsti: propone una distribuzione realistica dei voti negli esami
 * non bloccati, in modo che la media raggiunga l'obiettivo.
 *
 * Come funziona:
 * 1. si parte dalla media necessaria R negli esami liberi;
 * 2. ogni esame riceve uno scostamento in base alla difficoltà (facile +, difficile −),
 *    ricentrato in modo che la media pesata degli scostamenti sia zero;
 * 3. si aggiunge una variazione casuale e si arrotonda a un voto intero tra 18 e 30;
 * 4. correzione: si alzano di 1 i voti finché la media non raggiunge R, poi si abbassano
 *    quelli in eccesso finché resta ≥ R (così l'obiettivo è raggiunto senza sprechi).
 *
 * I voti bloccati non vengono mai toccati; la lode non viene mai generata.
 */
import { EPSILON } from './planning'
import { MAX_GRADE, MIN_GRADE, type Difficulty, type FutureExam, type Prediction } from './types'

/** Numero casuale tra 0 (incluso) e 1 (escluso), come Math.random. */
export type Random = () => number

/** Scostamento rispetto alla media necessaria, in base alla difficoltà. */
export const DIFFICULTY_OFFSET: Record<Difficulty, number> = {
  easy: 1.5,
  medium: 0,
  hard: -1.5,
}

/** Ampiezza della variazione casuale (± punti). */
export const DEFAULT_SPREAD = 1.5

export interface DistributionOptions {
  random?: Random
  spread?: number
}

export interface DistributionResult {
  /** Voto proposto per ogni esame, per id */
  grades: Record<string, number>
  /** false se l'obiettivo non è raggiungibile nemmeno con 30 ovunque (in quel caso tutti 30) */
  reachable: boolean
  /** Media pesata dei voti proposti; `null` se non ci sono esami */
  average: number | null
}

type DistributionExam = Pick<FutureExam, 'id' | 'cfu' | 'difficulty'>

const clampGrade = (value: number) => Math.min(MAX_GRADE, Math.max(MIN_GRADE, value))

/**
 * Propone voti interi (18–30) per gli esami indicati, con media pesata ≥ `required`.
 * Se `required` supera 30 l'obiettivo non è raggiungibile: tutti 30 e `reachable: false`.
 */
export function distributeGrades(
  exams: readonly DistributionExam[],
  required: number,
  { random = Math.random, spread = DEFAULT_SPREAD }: DistributionOptions = {},
): DistributionResult {
  if (exams.length === 0) return { grades: {}, reachable: true, average: null }

  const totalCfu = exams.reduce((sum, e) => sum + e.cfu, 0)
  const averageOf = (grades: number[]) =>
    grades.reduce((sum, g, i) => sum + g * exams[i].cfu, 0) / totalCfu
  const toRecord = (grades: number[]) =>
    Object.fromEntries(exams.map((e, i) => [e.id, grades[i]])) as Record<string, number>

  if (required > MAX_GRADE + EPSILON) {
    const grades = exams.map(() => MAX_GRADE)
    return { grades: toRecord(grades), reachable: false, average: averageOf(grades) }
  }

  // Valore attorno a cui generare: la media necessaria (almeno 18)
  const target = Math.max(required, MIN_GRADE)

  // Scostamenti per difficoltà, ricentrati sulla media pesata (così la media resta ≈ target)
  const meanOffset =
    exams.reduce((sum, e) => sum + DIFFICULTY_OFFSET[e.difficulty] * e.cfu, 0) / totalCfu
  const ideal = exams.map(
    (e) => target + DIFFICULTY_OFFSET[e.difficulty] - meanOffset + (random() * 2 - 1) * spread,
  )
  const grades = ideal.map((value) => clampGrade(Math.round(value)))

  // Indice dell'esame che conviene modificare: quello più lontano dal suo valore ideale
  const pick = (candidates: number[], score: (i: number) => number) =>
    candidates.reduce((best, i) => (score(i) < score(best) ? i : best), candidates[0])

  // Alza finché la media non raggiunge l'obiettivo (sempre possibile: required ≤ 30)
  while (averageOf(grades) < required - EPSILON) {
    const raisable = grades.flatMap((g, i) => (g < MAX_GRADE ? [i] : []))
    const i = pick(raisable, (j) => grades[j] - ideal[j])
    grades[i] += 1
  }

  // Abbassa i voti in eccesso finché la media resta ≥ obiettivo (se l'obiettivo è già
  // raggiunto con 18 ovunque, non serve: si lasciano i voti generati)
  if (required > MIN_GRADE + EPSILON) {
    for (;;) {
      const lowerable = grades.flatMap((g, i) => {
        if (g <= MIN_GRADE) return []
        const after = averageOf(grades) - exams[i].cfu / totalCfu
        return after >= required - EPSILON ? [i] : []
      })
      if (lowerable.length === 0) break
      const i = pick(lowerable, (j) => -(grades[j] - ideal[j]))
      grades[i] -= 1
    }
  }

  return { grades: toRecord(grades), reachable: true, average: averageOf(grades) }
}

/**
 * Nuove previsioni per uno scenario: i voti bloccati restano, tutti gli altri esami
 * ricevono un voto generato (senza lode, non bloccato).
 */
export function generatePredictions(
  futureExams: readonly FutureExam[],
  current: Readonly<Record<string, Prediction>>,
  required: number,
  options?: DistributionOptions,
): { predictions: Record<string, Prediction>; reachable: boolean } {
  const locked = Object.fromEntries(
    futureExams.flatMap((e) => (current[e.id]?.locked ? [[e.id, current[e.id]]] : [])),
  ) as Record<string, Prediction>
  const free = futureExams.filter((e) => !locked[e.id])
  const { grades, reachable } = distributeGrades(free, required, options)
  const generated = Object.fromEntries(
    Object.entries(grades).map(([id, grade]) => [id, { grade, lode: false, locked: false }]),
  )
  return { predictions: { ...locked, ...generated }, reachable }
}

/** Generatore pseudo-casuale con seme (mulberry32): stessi numeri a ogni esecuzione, per i test. */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
