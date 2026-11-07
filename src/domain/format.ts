/** Formattazione e lettura dei numeri in stile italiano (virgola decimale). */

const averageFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 })

export const EMPTY_VALUE = '—'

/** Media con due decimali: 26.8421 → "26,84"; `null` → "—". */
export function formatAverage(value: number | null): string {
  return value === null ? EMPTY_VALUE : averageFormatter.format(value)
}

/**
 * Media necessaria con due decimali arrotondata per eccesso, per non sottostimare
 * quello che serve: 28.121 → "28,13".
 */
export function formatRequired(value: number | null): string {
  if (value === null) return EMPTY_VALUE
  return averageFormatter.format(Math.ceil(value * 100 - 1e-6) / 100)
}

const numberFormatter = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 })

/** Numero con al massimo due decimali, senza zeri inutili: 31 → "31", 31.5 → "31,5". */
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatCfu(value: number): string {
  return `${integerFormatter.format(value)} CFU`
}

/** Voto da mostrare: 30 con lode → "30L". */
export function formatGrade(grade: number, lode: boolean): string {
  return lode ? `${grade}L` : String(grade)
}

/**
 * Legge un numero scritto dall'utente, accettando sia "27,5" sia "27.5".
 * Restituisce `null` se il testo è vuoto o non è un numero.
 */
export function parseDecimal(input: string): number | null {
  const text = input.trim().replace(',', '.')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(text)) return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Data AAAA-MM-GG in formato leggibile: "2025-02-10" → "10 feb 2025". */
export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return EMPTY_VALUE
  const date = new Date(`${isoDate}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date)
}

/** Data di oggi in formato AAAA-MM-GG (fuso orario locale), per i campi data. */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
