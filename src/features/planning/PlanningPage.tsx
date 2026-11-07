import { Pencil, Target } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAverage, formatCfu, formatRequired } from '../../domain/format'
import { describeGoal } from '../../domain/messages'
import { useAppState } from '../../state/context'
import { GoalDialog } from './GoalDialog'
import styles from './PlanningPage.module.css'

export function PlanningPage() {
  const { data, plan } = useAppState()
  const [goalOpen, setGoalOpen] = useState(false)
  const message = describeGoal(plan, data.settings.lodeValue)
  const hasGoal = plan.goalAverage !== null

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
          hint={hasGoal ? 'media da raggiungere' : 'non ancora impostato'}
          action={
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={hasGoal ? 'Modifica obiettivo' : 'Imposta obiettivo'}
              icon={<Pencil size={15} aria-hidden="true" />}
              onClick={() => setGoalOpen(true)}
            />
          }
        />
        <Stat
          label="Media necessaria"
          value={formatRequired(plan.evaluation?.required ?? null)}
          hint={hasGoal ? 'negli esami rimanenti' : 'imposta un obiettivo'}
          emphasis
        />
        <Stat
          label="CFU rimanenti"
          value={plan.future.cfu}
          hint={`${plan.future.count} ${plan.future.count === 1 ? 'esame' : 'esami'} da sostenere`}
        />
      </div>

      {message ? (
        <Card className={styles.status} aria-live="polite">
          {message.status && <StatusBadge tone={message.tone}>{message.title}</StatusBadge>}
          <p>{message.detail}</p>
        </Card>
      ) : (
        <Card className={styles.goalCta}>
          <Target size={22} className={styles.goalIcon} aria-hidden="true" />
          <div>
            <h2 className={styles.ctaTitle}>Imposta il tuo obiettivo</h2>
            <p className={styles.ctaText}>
              Scegli la media che vuoi raggiungere: calcolerò quanto ti serve negli esami rimanenti.
            </p>
          </div>
          <Button variant="primary" onClick={() => setGoalOpen(true)}>
            Imposta obiettivo
          </Button>
        </Card>
      )}

      <Card variant="placeholder" className={styles.placeholder}>
        Qui arriveranno la barra di avanzamento e la simulazione dei voti futuri (milestone 4).
      </Card>

      <GoalDialog open={goalOpen} onClose={() => setGoalOpen(false)} />
    </>
  )
}
