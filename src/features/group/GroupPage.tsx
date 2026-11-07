import { Layers } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { useAppState } from '../../state/context'
import { PlanningView } from '../planning/PlanningView'

/**
 * Pagina del gruppo di esami (funzione aggiuntiva): obiettivi e simulazioni propri,
 * calcolati solo sugli esami del gruppo.
 */
export function GroupPage() {
  const { data, group } = useAppState()

  if (!group) {
    return (
      <>
        <PageHeader title="Gruppo di esami" />
        <EmptyState
          icon={<Layers size={24} />}
          title="Il gruppo di esami non è attivo"
          action={<a href="#/impostazioni">Vai alle Impostazioni</a>}
        >
          Puoi attivarlo in Impostazioni → Funzioni aggiuntive.
        </EmptyState>
      </>
    )
  }

  const isEmpty = group.plan.passed.count + group.plan.future.count === 0

  return (
    <>
      <PageHeader
        title={data.group.name}
        description="Media calcolata solo sugli esami del gruppo, che restano anche nella media generale. Obiettivi e simulazioni di questa pagina sono separati da quelli della Pianificazione."
      />
      {isEmpty ? (
        <EmptyState icon={<Layers size={24} />} title="Nessun esame nel gruppo">
          Spunta la casella del gruppo quando aggiungi o modifichi un esame nel{' '}
          <a href="#/libretto">libretto</a> o negli <a href="#/futuri">esami da sostenere</a>.
        </EmptyState>
      ) : (
        <PlanningView
          view={group}
          firstGoalText="Scegli la media che vuoi raggiungere negli esami del gruppo, ad esempio la soglia per i punti di laurea. Potrai aggiungerne altre e confrontarle."
        />
      )}
    </>
  )
}
