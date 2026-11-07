/** Gestione del tema chiaro/scuro (logica pura, senza React). */

export type Theme = 'light' | 'dark'

/** Chiave in localStorage; la stessa è letta dallo script in index.html. */
export const THEME_STORAGE_KEY = 'piano-carriera:theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/** Scelta esplicita dell'utente se presente, altrimenti la preferenza del sistema. */
export function resolveTheme(stored: unknown, systemPrefersDark: boolean): Theme {
  if (isTheme(stored)) return stored
  return systemPrefersDark ? 'dark' : 'light'
}

export function toggleTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}
