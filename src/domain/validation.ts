/**
 * Validazione dei dati inseriti dall'utente, con messaggi chiari in italiano.
 * Le funzioni `validate*` ricevono il testo dei campi del modulo e restituiscono
 * il valore pulito oppure un errore per ciascun campo non valido.
 */
import { parseDecimal } from './format'
import {
  DIFFICULTIES,
  MAX_CFU,
  MAX_GRADE,
  MAX_LODE_VALUE,
  MAX_NAME_LENGTH,
  MIN_CFU,
  MIN_GRADE,
  MIN_LODE_VALUE,
  type Difficulty,
  type FutureExam,
  type PassedExam,
} from './types'

export type FieldErrors<K extends string> = Partial<Record<K, string>>

export type ValidationResult<T, K extends string> =
  { ok: true; value: T } | { ok: false; errors: FieldErrors<K> }

type FieldResult<T> = { value: T; error?: undefined } | { value?: undefined; error: string }

// ---------- Controlli sui valori (usati anche per verificare i dati salvati) ----------

export function isValidCfu(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_CFU && (value as number) <= MAX_CFU
}

export function isValidGrade(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_GRADE && (value as number) <= MAX_GRADE
}

export function isValidLodeValue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_LODE_VALUE &&
    value <= MAX_LODE_VALUE
  )
}

export function isValidGoalAverage(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= MIN_GRADE && value <= MAX_GRADE
  )
}

export function isValidDifficulty(value: unknown): value is Difficulty {
  return (DIFFICULTIES as readonly unknown[]).includes(value)
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

// ---------- Singoli campi ----------

export function validateName(raw: string): FieldResult<string> {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!name) return { error: 'Inserisci il nome dell’esame.' }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Il nome può avere al massimo ${MAX_NAME_LENGTH} caratteri.` }
  }
  return { value: name }
}

export function validateCfu(raw: string): FieldResult<number> {
  if (!raw.trim()) return { error: 'Inserisci i CFU.' }
  const value = parseDecimal(raw)
  if (value === null || !Number.isInteger(value)) {
    return { error: 'I CFU devono essere un numero intero.' }
  }
  if (!isValidCfu(value)) return { error: `I CFU devono essere tra ${MIN_CFU} e ${MAX_CFU}.` }
  return { value }
}

export function validateGrade(raw: string): FieldResult<number> {
  if (!raw.trim()) return { error: 'Inserisci il voto.' }
  const value = parseDecimal(raw)
  if (value === null || !Number.isInteger(value)) {
    return { error: 'Il voto deve essere un numero intero.' }
  }
  if (!isValidGrade(value)) {
    return { error: `Il voto deve essere tra ${MIN_GRADE} e ${MAX_GRADE}.` }
  }
  return { value }
}

export const LODE_ERROR = 'La lode è possibile solo con 30.'

export function validateLode(grade: number | undefined, lode: boolean): string | undefined {
  return lode && grade !== undefined && grade !== MAX_GRADE ? LODE_ERROR : undefined
}

export function validateLodeValue(raw: string): FieldResult<number> {
  const value = parseDecimal(raw)
  if (value === null || !isValidLodeValue(value)) {
    return {
      error: `Il valore della lode deve essere un numero tra ${MIN_LODE_VALUE} e ${MAX_LODE_VALUE}.`,
    }
  }
  return { value }
}

export function validateGoalAverage(raw: string): FieldResult<number> {
  if (!raw.trim()) return { error: 'Inserisci la media che vuoi raggiungere.' }
  const value = parseDecimal(raw)
  if (value === null) return { error: 'La media deve essere un numero, ad esempio 27,5.' }
  if (!isValidGoalAverage(value)) {
    return { error: `La media obiettivo deve essere tra ${MIN_GRADE} e ${MAX_GRADE}.` }
  }
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
    return { error: 'Usa al massimo due decimali.' }
  }
  return { value }
}

function validateOptionalDate(raw: string): FieldResult<string | undefined> {
  const text = raw.trim()
  if (!text) return { value: undefined }
  if (!isValidDate(text)) return { error: 'La data non è valida.' }
  return { value: text }
}

function collect<K extends string>(
  fields: Partial<Record<K, { error?: string } | string | undefined>>,
) {
  const errors: FieldErrors<K> = {}
  for (const key of Object.keys(fields) as K[]) {
    const field = fields[key]
    const error = typeof field === 'string' ? field : field?.error
    if (error) errors[key] = error
  }
  return errors
}

// ---------- Moduli completi ----------

export interface PassedExamForm {
  name: string
  cfu: string
  grade: string
  lode: boolean
  date: string
  /** Solo se il gruppo di esami è attivo */
  inGroup?: boolean
}

export type PassedExamField = keyof PassedExamForm

export function validatePassedExam(
  form: PassedExamForm,
): ValidationResult<Omit<PassedExam, 'id'>, PassedExamField> {
  const name = validateName(form.name)
  const cfu = validateCfu(form.cfu)
  const grade = validateGrade(form.grade)
  const lode = validateLode(grade.value, form.lode)
  const date = validateOptionalDate(form.date)

  const errors = collect<PassedExamField>({ name, cfu, grade, lode, date })
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const exam: Omit<PassedExam, 'id'> = {
    name: name.value!,
    cfu: cfu.value!,
    grade: grade.value!,
    lode: form.lode,
  }
  if (date.value) exam.date = date.value
  if (form.inGroup) exam.inGroup = true
  return { ok: true, value: exam }
}

export interface FutureExamForm {
  name: string
  cfu: string
  difficulty: string
  /** Solo se il gruppo di esami è attivo */
  inGroup?: boolean
}

export type FutureExamField = keyof FutureExamForm

export function validateFutureExam(
  form: FutureExamForm,
): ValidationResult<Omit<FutureExam, 'id'>, FutureExamField> {
  const name = validateName(form.name)
  const cfu = validateCfu(form.cfu)
  const difficulty = isValidDifficulty(form.difficulty)
    ? undefined
    : 'Scegli la difficoltà: facile, media o difficile.'

  const errors = collect<FutureExamField>({ name, cfu, difficulty })
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const exam: Omit<FutureExam, 'id'> = {
    name: name.value!,
    cfu: cfu.value!,
    difficulty: form.difficulty as Difficulty,
  }
  if (form.inGroup) exam.inGroup = true
  return { ok: true, value: exam }
}
