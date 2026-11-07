/**
 * Migrazioni dello schema dei dati salvati.
 *
 * Ogni volta che la forma dei dati cambia (es. scenari multipli, sessioni d'esame),
 * si incrementa SCHEMA_VERSION e si aggiunge qui una funzione che converte
 * i dati dalla versione precedente: chi ha già dei dati salvati non perde nulla.
 */

export const SCHEMA_VERSION = 1

export type Migration = (data: unknown) => unknown

/** Chiave = versione di partenza. Esempio futuro: `1: (data) => ({ ...data, sessions: [] })` */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {}

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
