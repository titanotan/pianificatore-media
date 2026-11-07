import { PageHeader } from '../../components/PageHeader'
import { useAppState } from '../../state/context'
import { Welcome } from '../onboarding/Welcome'
import { PlanningView } from './PlanningView'

/** Pianificazione della media generale (tutti gli esami); senza esami mostra la guida iniziale. */
export function PlanningPage() {
  const { data, main } = useAppState()

  if (data.passedExams.length === 0 && data.futureExams.length === 0) return <Welcome />

  return (
    <>
      <PageHeader
        title="Pianificazione"
        description="Imposta uno o più obiettivi di media, confrontali e simula i voti che ti servono."
      />
      <PlanningView
        view={main}
        firstGoalText="Scegli la media che vuoi raggiungere: calcolerò quanto ti serve negli esami rimanenti. Potrai aggiungerne altri (es. 25, 26, 27) e confrontarli."
      />
    </>
  )
}
