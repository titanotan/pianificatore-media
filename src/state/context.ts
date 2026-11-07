import { createContext, useContext, type Dispatch } from 'react'
import type { ScopeView } from '../domain/scenarios'
import type { Plan } from '../domain/simulation'
import type { AppData } from '../domain/types'
import type { LoadResult } from '../storage/storage'
import type { AppAction } from './reducer'

export interface AppStateValue {
  data: AppData
  dispatch: Dispatch<AppAction>
  /** Calcoli della media generale con l'obiettivo selezionato (scorciatoia per `main.plan`) */
  plan: Plan
  /** Pianificazione della media generale */
  main: ScopeView
  /** Pianificazione del gruppo di esami; `null` se la funzione è spenta */
  group: ScopeView | null
  /** Esito della lettura dei dati all'avvio */
  load: Pick<LoadResult, 'status' | 'message'>
  /** false se il browser non permette di salvare (es. navigazione privata) */
  persistent: boolean
  /** false se l'ultimo salvataggio non è riuscito */
  saveOk: boolean
}

export const AppStateContext = createContext<AppStateValue | null>(null)

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState va usato dentro <AppStateProvider>')
  return value
}
