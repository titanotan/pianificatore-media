import { createContext, useContext, type Dispatch } from 'react'
import type { AppData } from '../domain/types'
import type { Plan } from '../domain/simulation'
import type { LoadResult } from '../storage/storage'
import type { AppAction } from './reducer'

export interface AppStateValue {
  data: AppData
  dispatch: Dispatch<AppAction>
  /** Tutti i calcoli (medie, obiettivo, simulazione), ricalcolati a ogni modifica */
  plan: Plan
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
