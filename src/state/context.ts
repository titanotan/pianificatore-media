import { createContext, useContext, type Dispatch } from 'react'
import type { AppData } from '../domain/types'
import type { ReachableRange, ScenarioPlan } from '../domain/scenarios'
import type { Plan } from '../domain/simulation'
import type { Scenario } from '../domain/types'
import type { LoadResult } from '../storage/storage'
import type { AppAction } from './reducer'

export interface AppStateValue {
  data: AppData
  dispatch: Dispatch<AppAction>
  /** Calcoli dell'obiettivo selezionato (o solo medie, se non ci sono obiettivi) */
  plan: Plan
  /** Obiettivo selezionato, `null` se non ce ne sono */
  activeScenario: Scenario | null
  /** Tutti gli obiettivi con i loro calcoli, ordinati per media */
  scenarioPlans: ScenarioPlan[]
  /** Medie finali raggiungibili (indipendenti dagli obiettivi) */
  range: ReachableRange | null
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
