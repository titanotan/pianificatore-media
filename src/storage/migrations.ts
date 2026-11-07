/**
 * Migrazioni dello schema dei dati salvati.
 *
 * Ogni volta che la forma dei dati cambia (es. scenari multipli, sessioni d'esame),
 * si incrementa SCHEMA_VERSION e si aggiunge qui una funzione che converte
 * i dati dalla versione precedente: chi ha già dei dati salvati non perde nulla.
 */

export const SCHEMA_VERSION = 2

export type Migration = (data: unknown) => unknown

type Obj = Record<string, unknown>
const isObject = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * v1 → v2: da un solo obiettivo a più obiettivi.
 * In v1 l'obiettivo stava in `data.goal` e i voti previsti in `scenarios`;
 * in v2 ogni scenario ha il suo obiettivo. L'obiettivo esistente diventa il primo scenario
 * (con i voti previsti dello scenario attivo); senza obiettivo non c'è nessuno scenario.
 */
export function migrateV1toV2(data: unknown): unknown {
  if (!isObject(data)) return data
  const { goal, scenarios, activeScenarioId, ...rest } = data
  if (!isObject(goal)) return { ...rest, scenarios: [], activeScenarioId: null }

  const list = Array.isArray(scenarios) ? scenarios.filter(isObject) : []
  const active = list.find((s) => s.id === activeScenarioId) ?? list[0]
  const id = typeof active?.id === 'string' && active.id ? active.id : 'obiettivo-1'
  return {
    ...rest,
    scenarios: [
      { id, name: '', goal, predictions: isObject(active?.predictions) ? active.predictions : {} },
    ],
    activeScenarioId: id,
  }
}

/** Chiave = versione di partenza. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  1: migrateV1toV2,
}

export class UnsupportedVersionError extends Error {
  readonly version: number

  constructor(version: number, message: string) {
    super(message)
    this.name = 'UnsupportedVersionError'
    this.version = version
  }
}

/** Porta i dati dalla versione `fromVersion` alla versione `targetVersion`, un passo alla volta. */
export function migrate(
  data: unknown,
  fromVersion: number,
  targetVersion: number = SCHEMA_VERSION,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): unknown {
  if (!Number.isInteger(fromVersion) || fromVersion < 1) {
    throw new UnsupportedVersionError(fromVersion, `Versione dei dati non valida: ${fromVersion}`)
  }
  if (fromVersion > targetVersion) {
    throw new UnsupportedVersionError(
      fromVersion,
      `I dati sono stati salvati da una versione più recente dell'app (v${fromVersion}).`,
    )
  }
  let current = data
  for (let version = fromVersion; version < targetVersion; version++) {
    const step = migrations[version]
    if (!step) {
      throw new UnsupportedVersionError(version, `Manca la migrazione dalla versione ${version}.`)
    }
    current = step(current)
  }
  return current
}
