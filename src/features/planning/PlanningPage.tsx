import { PageHeader } from '../../components/PageHeader'
import { useAppState } from '../../state/context'
import { PlanningView } from './PlanningView'

/** Pianificazione della media generale (tutti gli esami). */
export function PlanningPage() {
  const { main } = useAppState()
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
