import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { formatAverage, formatCfu, formatRequired } from '../../domain/format'
import { useAppState } from '../../state/context'
import styles from './PlanningPage.module.css'

export function PlanningPage() {
  const { plan } = useAppState()

  return (
    <>
      <PageHeader
        title="Pianificazione"
        description="Scopri che voti ti servono negli esami che mancano per raggiungere il tuo obiettivo."
      />

      <div className={styles.stats}>
        <Stat
          label="Media attuale"
          value={formatAverage(plan.passed.average)}
          hint={`su ${formatCfu(plan.passed.cfu)} sostenuti`}
        />
        <Stat
          label="Obiettivo"
          value={formatAverage(plan.goalAverage)}
          hint="media da raggiungere"
        />
        <Stat
          label="Media necessaria"
          value={formatRequired(plan.evaluation?.required ?? null)}
          hint="negli esami rimanenti"
          emphasis
        />
        <Stat
          label="CFU rimanenti"
          value={plan.future.cfu}
          hint={`${plan.future.count} esami da sostenere`}
        />
      </div>

      <Card variant="placeholder">
        Qui arriveranno lo stato dell’obiettivo e la simulazione dei voti futuri (milestone 4).
      </Card>
    </>
  )
}
