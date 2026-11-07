/**
 * Frasi che spiegano lo stato dell'obiettivo, a partire dal calcolo della pianificazione.
 * Stanno nel dominio (e non nei componenti) per poterle testare.
 */
import { formatAverage, formatCfu, formatNumber, formatRequired } from './format'
import type { GoalStatus } from './planning'
import type { Plan } from './simulation'
import { MAX_GRADE } from './types'

export type GoalTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

export interface GoalMessage {
  /** Stato (null se non si può ancora calcolare) */
  status: GoalStatus | null
  /** Etichetta breve, es. "Al limite" */
  title: string
  /** Frase di spiegazione */
  detail: string
  tone: GoalTone
}

export const STATUS_LABELS: Record<GoalStatus, string> = {
  reached: 'Già raggiunto',
  reachable: 'Raggiungibile',
  tight: 'Al limite',
  'lode-only': 'Solo con lodi',
  impossible: 'Non raggiungibile',
}

export const STATUS_TONES: Record<GoalStatus, GoalTone> = {
  reached: 'info',
  reachable: 'ok',
  tight: 'warn',
  'lode-only': 'warn',
  impossible: 'danger',
}

/** Messaggio sullo stato dell'obiettivo; `null` se l'obiettivo non è impostato. */
export function describeGoal(plan: Plan, lodeValue: number): GoalMessage | null {
  if (plan.goalAverage === null) return null

  const evaluation = plan.evaluation
  if (!evaluation) {
    return {
      status: null,
      title: 'Mancano gli esami',
      detail: 'Aggiungi gli esami sostenuti e quelli da sostenere per sapere che media ti serve.',
      tone: 'neutral',
    }
  }

  const { status, required, minFinal, maxFinal } = evaluation
  const { freeCfu, lockedCount } = plan.future
  // Se ci sono voti bloccati, "cosa serve" riguarda solo gli esami non bloccati
  const where =
    lockedCount > 0
      ? `nei ${formatCfu(freeCfu)} non bloccati`
      : `nei ${formatCfu(freeCfu)} rimanenti`
  const base = { status, title: STATUS_LABELS[status], tone: STATUS_TONES[status] }
  const best = lodeValue > MAX_GRADE ? '30 e lode' : '30'

  if (required === null) {
    // Nessun esame libero: la media finale è già determinata
    return status === 'reached'
      ? { ...base, detail: `Con questi voti la tua media finale è ${formatAverage(minFinal)}.` }
      : {
          ...base,
          detail: `Con questi voti la tua media finale è ${formatAverage(minFinal)}, sotto l’obiettivo.`,
        }
  }

  switch (status) {
    case 'reached':
      return {
        ...base,
        detail: `Anche prendendo 18 in tutti gli esami ${lockedCount > 0 ? 'non bloccati' : 'rimanenti'} arriveresti a ${formatAverage(minFinal)}.`,
      }
    case 'reachable':
      return { ...base, detail: `Ti serve una media di ${formatRequired(required)} ${where}.` }
    case 'tight':
      return {
        ...base,
        detail: `Ti serve una media di ${formatRequired(required)} ${where}: quasi il massimo.`,
      }
    case 'lode-only':
      return {
        ...base,
        detail: `Ti serve una media di ${formatRequired(required)} ${where}: più di 30, possibile solo con delle lodi (la lode vale ${formatNumber(lodeValue)}).`,
      }
    case 'impossible':
      return {
        ...base,
        detail: `Anche con ${best} in tutti gli esami ${lockedCount > 0 ? 'non bloccati' : 'rimanenti'} arriveresti al massimo a ${formatAverage(maxFinal)}.`,
      }
  }
}
