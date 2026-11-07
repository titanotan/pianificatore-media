/**
 * Gruppo di esami: la stessa pianificazione della media generale,
 * calcolata solo sugli esami del gruppo.
 */
import { computePlan, type Plan } from './simulation'
import { MAX_GROUP_NAME_LENGTH, type AppData, type Scenario } from './types'

/** Esami (sostenuti e futuri) che fanno parte del gruppo. */
export function groupExams(data: AppData) {
  return {
    passed: data.passedExams.filter((e) => e.inGroup === true),
    future: data.futureExams.filter((e) => e.inGroup === true),
  }
}

/**
 * Pianificazione del gruppo: media attuale, media prevista con i voti dello scenario
 * indicato (di solito l'obiettivo selezionato) e media necessaria per l'obiettivo del gruppo.
 */
export function planForGroup(data: AppData, scenario: Scenario | null): Plan {
  const { passed, future } = groupExams(data)
  return computePlan({
    passedExams: passed,
    futureExams: future,
    predictions: scenario?.predictions ?? {},
    settings: data.settings,
    goal: data.group.goal,
  })
}

export function validateGroupName(
  raw: string,
): { value: string; error?: undefined } | { value?: undefined; error: string } {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!name) return { error: 'Dai un nome al gruppo.' }
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    return { error: `Il nome può avere al massimo ${MAX_GROUP_NAME_LENGTH} caratteri.` }
  }
  return { value: name }
}
