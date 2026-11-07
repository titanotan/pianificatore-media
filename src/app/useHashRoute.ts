import { useEffect, useState } from 'react'
import { parseRoute, type RouteId } from './routes'

/** Sezione corrente, aggiornata quando cambia l'hash dell'URL (link, avanti/indietro del browser). */
export function useHashRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
