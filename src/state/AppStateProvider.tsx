import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { planForGroup } from '../domain/group'
import { planAllScenarios, planForScenario, reachableRange } from '../domain/scenarios'
import { getBrowserStorage, loadData, saveData } from '../storage/storage'
import { AppStateContext, type AppStateValue } from './context'
import { appReducer, getActiveScenario } from './reducer'

/** Carica i dati all'avvio, li salva a ogni modifica e mette a disposizione i calcoli. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [{ storage, persistent }] = useState(getBrowserStorage)
  const [initial] = useState(() => loadData(storage))
  const [data, dispatch] = useReducer(appReducer, initial.data)
  const [saveOk, setSaveOk] = useState(true)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Al primo render i dati sono quelli appena letti: salvarli subito sovrascriverebbe
    // inutilmente il salvataggio (e, in caso di errore, l'originale è già nel backup).
    if (isFirstRender.current && initial.status !== 'recovered') {
      isFirstRender.current = false
      return
    }
    isFirstRender.current = false
    setSaveOk(saveData(storage, data))
  }, [data, storage, initial.status])

  const derived = useMemo(() => {
    const activeScenario = getActiveScenario(data)
    return {
      activeScenario,
      plan: planForScenario(data, activeScenario),
      scenarioPlans: planAllScenarios(data),
      range: reachableRange(data),
      groupPlan: data.group.enabled ? planForGroup(data, activeScenario) : null,
    }
  }, [data])

  const value = useMemo<AppStateValue>(
    () => ({
      data,
      dispatch,
      ...derived,
      load: { status: initial.status, message: initial.message },
      persistent,
      saveOk,
    }),
    [data, derived, initial.status, initial.message, persistent, saveOk],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
