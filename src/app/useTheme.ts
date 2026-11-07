import { useCallback, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, isTheme, resolveTheme, toggleTheme, type Theme } from './theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

/**
 * Tema corrente. Finché l'utente non sceglie, segue il sistema (anche se cambia mentre l'app è aperta);
 * dopo un clic sul pulsante la scelta viene salvata e ha la precedenza.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveTheme(readStoredTheme(), darkQuery().matches),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const query = darkQuery()
    const onChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme() === null) setTheme(event.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = toggleTheme(current)
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // localStorage non disponibile (es. navigazione privata): il tema vale solo per questa visita
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
