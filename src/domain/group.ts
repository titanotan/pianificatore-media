/**
 * Gruppo di esami: ha obiettivi e simulazioni propri, calcolati solo sui suoi esami
 * (vedi `scopeData` in scenarios.ts, ambito `group`).
 */
import { MAX_GROUP_NAME_LENGTH, type AppData } from './types'

/** Esami (sostenuti e futuri) che fanno parte del gruppo. */
export function groupExams(data: AppData) {
  return {
    passed: data.passedExams.filter((e) => e.inGroup === true),
    future: data.futureExams.filter((e) => e.inGroup === true),
  }
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
