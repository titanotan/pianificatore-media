/**
 * Controllo dei dati letti da localStorage: tiene solo ciò che è valido e scarta il resto,
 * così un dato rovinato (o modificato a mano) non blocca l'app.
 */
import {
  isValidCfu,
  isValidDate,
  isValidDifficulty,
  isValidGoalAverage,
  isValidGrade,
  isValidLodeValue,
} from '../domain/validation'
import {
  DEFAULT_LODE_VALUE,
  MAX_GRADE,
  MAX_NAME_LENGTH,
  MAX_SCENARIOS,
  createEmptyData,
  type AppData,
  type FutureExam,
  type Goal,
  type PassedExam,
  type Prediction,
  type Scenario,
} from '../domain/types'

export interface SanitizeResult {
  data: AppData
  /** Numero di elementi scartati perché non validi */
  dropped: number
}

type Obj = Record<string, unknown>

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim()
  return name && name.length <= MAX_NAME_LENGTH ? name : null
}

function sanitizePassedExam(raw: unknown): PassedExam | null {
  if (!isObject(raw)) return null
  const name = cleanName(raw.name)
  if (!isValidId(raw.id) || !name || !isValidCfu(raw.cfu) || !isValidGrade(raw.grade)) return null
  const exam: PassedExam = {
    id: raw.id,
    name,
    cfu: raw.cfu,
    grade: raw.grade,
    lode: raw.lode === true && raw.grade === MAX_GRADE,
  }
  if (isValidDate(raw.date)) exam.date = raw.date
  return exam
}

function sanitizeFutureExam(raw: unknown): FutureExam | null {
  if (!isObject(raw)) return null
  const name = cleanName(raw.name)
  if (!isValidId(raw.id) || !name || !isValidCfu(raw.cfu)) return null
  return {
    id: raw.id,
    name,
    cfu: raw.cfu,
    difficulty: isValidDifficulty(raw.difficulty) ? raw.difficulty : 'medium',
  }
}

function sanitizePrediction(raw: unknown): Prediction | null {
  if (!isObject(raw) || !isValidGrade(raw.grade)) return null
  return {
    grade: raw.grade,
    lode: raw.lode === true && raw.grade === MAX_GRADE,
    locked: raw.locked === true,
  }
}

function sanitizeGoal(raw: unknown): Goal | null {
  if (isObject(raw) && raw.kind === 'average' && isValidGoalAverage(raw.value)) {
    return { kind: 'average', value: raw.value }
  }
  return null
}

/** Filtra un elenco tenendo gli elementi validi con id non duplicato. */
function sanitizeList<T extends { id: string }>(
  raw: unknown,
  sanitizeItem: (item: unknown) => T | null,
): { items: T[]; dropped: number } {
  if (!Array.isArray(raw)) return { items: [], dropped: raw === undefined ? 0 : 1 }
  const items: T[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    const item = sanitizeItem(entry)
    if (item && !seen.has(item.id)) {
      seen.add(item.id)
      items.push(item)
    }
  }
  return { items, dropped: raw.length - items.length }
}

export function sanitizeAppData(raw: unknown): SanitizeResult {
  const empty = createEmptyData()
  if (!isObject(raw)) return { data: empty, dropped: 1 }

  let dropped = 0

  const passed = sanitizeList(raw.passedExams, sanitizePassedExam)
  const future = sanitizeList(raw.futureExams, sanitizeFutureExam)
  dropped += passed.dropped + future.dropped

  const futureIds = new Set(future.items.map((exam) => exam.id))

  const settingsRaw = isObject(raw.settings) ? raw.settings : {}
  const lodeValue = isValidLodeValue(settingsRaw.lodeValue)
    ? settingsRaw.lodeValue
    : DEFAULT_LODE_VALUE
  if (settingsRaw.lodeValue !== undefined && lodeValue !== settingsRaw.lodeValue) dropped += 1

  const scenarioList = sanitizeList<Scenario>(raw.scenarios, (entry) => {
    if (!isObject(entry) || !isValidId(entry.id)) return null
    const goal = sanitizeGoal(entry.goal)
    if (!goal) return null
    const predictions: Record<string, Prediction> = {}
    if (isObject(entry.predictions)) {
      for (const [examId, value] of Object.entries(entry.predictions)) {
        const prediction = sanitizePrediction(value)
        // Le previsioni di esami che non esistono più vengono scartate senza contarle come errori
        if (prediction && futureIds.has(examId)) predictions[examId] = prediction
        else if (!prediction) dropped += 1
      }
    }
    return {
      id: entry.id,
      name: typeof entry.name === 'string' ? (cleanName(entry.name) ?? '') : '',
      goal,
      predictions,
    }
  })
  dropped += scenarioList.dropped

  const scenarios = scenarioList.items.slice(0, MAX_SCENARIOS)
  dropped += scenarioList.items.length - scenarios.length
  const activeScenarioId = scenarios.some((s) => s.id === raw.activeScenarioId)
    ? (raw.activeScenarioId as string)
    : (scenarios[0]?.id ?? null)

  return {
    data: {
      passedExams: passed.items,
      futureExams: future.items,
      settings: { lodeValue },
      scenarios,
      activeScenarioId,
    },
    dropped,
  }
}
