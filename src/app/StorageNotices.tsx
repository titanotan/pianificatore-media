import { useState } from 'react'
import { Notice } from '../components/Notice'
import { useAppState } from '../state/context'

/** Avvisi sullo stato del salvataggio, mostrati in cima a ogni pagina quando serve. */
export function StorageNotices() {
  const { load, persistent, saveOk } = useAppState()
  const [loadDismissed, setLoadDismissed] = useState(false)

  return (
    <>
      {!loadDismissed &&
        (load.status === 'recovered' || load.status === 'error') &&
        load.message && (
          <Notice tone="warn" onDismiss={() => setLoadDismissed(true)}>
            {load.message}
          </Notice>
        )}
      {!persistent && (
        <Notice tone="warn">
          Questo browser non permette di salvare i dati (forse sei in navigazione privata): quello
          che inserisci andrà perso alla chiusura della pagina.
        </Notice>
      )}
      {persistent && !saveOk && (
        <Notice tone="danger">
          L’ultima modifica non è stata salvata: lo spazio del browser potrebbe essere esaurito.
        </Notice>
      )}
    </>
  )
}
