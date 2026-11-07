/**
 * Sezioni dell'app e navigazione tramite hash (#/piano, #/libretto, ...).
 * L'hash non viene mai inviato al server, quindi su GitHub Pages non ci sono errori 404.
 */

export const ROUTE_IDS = ['piano', 'libretto', 'futuri', 'impostazioni'] as const

export type RouteId = (typeof ROUTE_IDS)[number]

export const DEFAULT_ROUTE: RouteId = 'piano'

export interface RouteInfo {
  id: RouteId
  /** Etichetta completa (menu laterale, titolo pagina) */
  label: string
  /** Etichetta corta per la barra in basso su smartphone */
  shortLabel: string
}

export const ROUTES: readonly RouteInfo[] = [
  { id: 'piano', label: 'Pianificazione', shortLabel: 'Piano' },
  { id: 'libretto', label: 'Esami sostenuti', shortLabel: 'Libretto' },
  { id: 'futuri', label: 'Esami da sostenere', shortLabel: 'Futuri' },
  { id: 'impostazioni', label: 'Impostazioni', shortLabel: 'Impost.' },
]

export function isRouteId(value: string): value is RouteId {
  return (ROUTE_IDS as readonly string[]).includes(value)
}

/** Converte l'hash dell'URL nella sezione corrispondente; hash vuoti o sconosciuti → Pianificazione. */
export function parseRoute(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, '').split(/[/?]/)[0].toLowerCase()
  return isRouteId(id) ? id : DEFAULT_ROUTE
}

export function routeHref(id: RouteId): string {
  return `#/${id}`
}
