/**
 * Lettura e scrittura dei dati in localStorage.
 *
 * Formato salvato: { "version": 1, "data": { ...AppData } }
 * Se i dati non sono leggibili, ne viene fatta una copia di sicurezza in un'altra chiave
 * prima di ripartire da zero, così non si perde mai nulla.
 */
import { createEmptyData, type AppData } from '../domain/types'
import { SCHEMA_VERSION, migrate } from './migrations'
import { sanitizeAppData } from './sanitize'

export const DATA_STORAGE_KEY = 'pianificatore-media:data'
export const BACKUP_STORAGE_KEY = 'pianificatore-media:data-backup'

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * - empty      nessun dato salvato (primo avvio)
 * - loaded     dati letti correttamente
 * - recovered  dati letti, ma alcuni elementi non validi sono stati scartati
 * - error      dati illeggibili: copiati nella chiave di backup, si riparte da zero
 */
export type LoadStatus = 'empty' | 'loaded' | 'recovered' | 'error'

export interface LoadResult {
  data: AppData
  status: LoadStatus
  message?: string
}

function backup(storage: KeyValueStorage, raw: string) {
  try {
    storage.setItem(BACKUP_STORAGE_KEY, raw)
  } catch {
    // spazio esaurito o storage non disponibile: non possiamo fare altro
  }
}

export function loadData(storage: KeyValueStorage): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(DATA_STORAGE_KEY)
  } catch {
    return {
      data: createEmptyData(),
      status: 'error',
      message: 'Il browser non permette di leggere i dati salvati.',
    }
  }
  if (raw === null) return { data: createEmptyData(), status: 'empty' }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
      throw new Error('Formato dei dati non riconosciuto.')
    }
    const { version, data } = parsed as { version: unknown; data: unknown }
    const migrated = migrate(data, Number(version))
    const { data: clean, dropped } = sanitizeAppData(migrated)
    if (dropped > 0) {
      backup(storage, raw)
      return {
        data: clean,
        status: 'recovered',
        message: `Alcuni dati salvati non erano validi e sono stati ignorati (${dropped}).`,
      }
    }
    return { data: clean, status: 'loaded' }
  } catch (error) {
    backup(storage, raw)
    // Il dettaglio è mostrato solo per i nostri errori (in italiano), non per quelli tecnici del browser
    const detail =
      error instanceof Error && !(error instanceof SyntaxError) ? ` ${error.message}` : ''
    return {
      data: createEmptyData(),
      status: 'error',
      message: `Non è stato possibile leggere i dati salvati: ne è stata fatta una copia di sicurezza.${detail}`,
    }
  }
}

/** Salva i dati; restituisce false se il browser non lo permette (es. spazio esaurito). */
export function saveData(storage: KeyValueStorage, data: AppData): boolean {
  try {
    storage.setItem(DATA_STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, data }))
    return true
  } catch {
    return false
  }
}

/** Storage in memoria: usato nei test e quando localStorage non è disponibile. */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  dump: () => Record<string, string>
} {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, String(value))
    },
    dump: () => Object.fromEntries(map),
  }
}

/** localStorage del browser se disponibile, altrimenti uno storage in memoria (dati non persistenti). */
export function getBrowserStorage(): { storage: KeyValueStorage; persistent: boolean } {
  try {
    const probe = '__pianificatore-media-probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return { storage: window.localStorage, persistent: true }
  } catch {
    return { storage: createMemoryStorage(), persistent: false }
  }
}
