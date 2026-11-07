import { Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { formatAverage, formatCfu } from '../../domain/format'
import { canAddScenario, scenarioLabel } from '../../domain/scenarios'
import { MAX_GRADE, MAX_SCENARIOS, type Scenario } from '../../domain/types'
import { useAppState } from '../../state/context'
import { GoalDialog, type GoalDialogMode } from './GoalDialog'
import { GoalsTable } from './GoalsTable'
import { GroupCard } from './GroupCard'
import styles from './PlanningPage.module.css'
import { SimulationPanel } from './SimulationPanel'

export function PlanningPage() {
  const { data, dispatch, plan, activeScenario, scenarioPlans, range } = useAppState()
  const [dialog, setDialog] = useState<GoalDialogMode>(null)
  const [toDelete, setToDelete] = useState<Scenario | null>(null)
  const canAdd = canAddScenario(data)
  const lodeAbove30 = data.settings.lodeValue > MAX_GRADE

  const addButton = (
    <Button
      variant="primary"
      icon={<Plus size={18} aria-hidden="true" />}
      onClick={() => setDialog({ mode: 'add' })}
      disabled={!canAdd}
      title={canAdd ? undefined : `Puoi avere al massimo ${MAX_SCENARIOS} obiettivi`}
    >
      Nuovo obiettivo
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Pianificazione"
        description="Imposta uno o più obiettivi di media, confrontali e simula i voti che ti servono."
      />

      <div className={styles.stats}>
        <Stat
          label="Media attuale"
          value={formatAverage(plan.passed.average)}
          hint={`su ${formatCfu(plan.passed.cfu)} sostenuti`}
          emphasis
        />
        <Stat
          label="CFU rimanenti"
          value={plan.future.cfu}
          hint={`${plan.future.count} ${plan.future.count === 1 ? 'esame' : 'esami'} da sostenere`}
        />
        <Stat
          label="Media minima"
          value={formatAverage(range?.min ?? null)}
          hint="con 18 in tutti gli esami rimanenti"
        />
        <Stat
          label="Media massima"
          value={formatAverage(range?.max ?? null)}
          hint={
            lodeAbove30 && range
              ? `con 30 ovunque (con lode: ${formatAverage(range.maxWithLode)})`
              : 'con 30 in tutti gli esami rimanenti'
          }
        />
      </div>

      <GroupCard />

      {data.scenarios.length === 0 ? (
        <Card className={styles.goalCta}>
          <Target size={22} className={styles.goalIcon} aria-hidden="true" />
          <div>
            <h2 className={styles.ctaTitle}>Imposta il tuo primo obiettivo</h2>
            <p className={styles.ctaText}>
              Scegli la media che vuoi raggiungere: calcolerò quanto ti serve negli esami rimanenti.
              Potrai aggiungerne altri (es. 25, 26, 27) e confrontarli.
            </p>
          </div>
          <Button variant="primary" onClick={() => setDialog({ mode: 'add' })}>
            Imposta obiettivo
          </Button>
        </Card>
      ) : (
        <>
          <section className={styles.goals} aria-labelledby="obiettivi-titolo">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="obiettivi-titolo" className={styles.sectionTitle}>
                  I tuoi obiettivi
                </h2>
                <p className={styles.sectionText}>
                  Seleziona un obiettivo per vederne la simulazione.
                </p>
              </div>
              {addButton}
            </div>
            <GoalsTable
              items={scenarioPlans}
              activeId={activeScenario?.id ?? null}
              canDuplicate={canAdd}
              onSelect={(s) => dispatch({ type: 'scenario/select', id: s.id })}
              onEdit={(s) => setDialog({ mode: 'edit', scenario: s })}
              onDuplicate={(s) => setDialog({ mode: 'add', copyFromId: s.id })}
              onDelete={setToDelete}
            />
            {!canAdd && (
              <p className={styles.sectionText}>
                Hai raggiunto il massimo di {MAX_SCENARIOS} obiettivi.
              </p>
            )}
          </section>

          {activeScenario && <SimulationPanel scenario={activeScenario} plan={plan} />}
        </>
      )}

      <GoalDialog state={dialog} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminare l’obiettivo?"
        message={
          toDelete &&
          `Verrà eliminato l’obiettivo ${scenarioLabel(toDelete)} con la sua simulazione. Gli altri obiettivi non cambiano.`
        }
        confirmLabel="Elimina"
        onConfirm={() => {
          if (toDelete) dispatch({ type: 'scenario/remove', id: toDelete.id })
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
