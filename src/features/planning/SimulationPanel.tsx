import { Eraser } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAverage, formatCfu, formatRequired } from '../../domain/format'
import { describeGoal } from '../../domain/messages'
import { EPSILON } from '../../domain/planning'
import { scenarioLabel } from '../../domain/scenarios'
import type { Plan } from '../../domain/simulation'
import { MAX_GRADE, MIN_GRADE, type Scenario } from '../../domain/types'
import { useAppState } from '../../state/context'
import { GoalBar } from './GoalBar'
import styles from './Simulation.module.css'
import { SimulationTable } from './SimulationTable'

/** Voto da suggerire negli esami senza voto previsto: la media necessaria arrotondata per eccesso. */
function suggestedGrade(plan: Plan): string | undefined {
  const evaluation = plan.evaluation
  if (!evaluation || evaluation.required === null || evaluation.status === 'impossible') return
  const grade = Math.min(MAX_GRADE, Math.max(MIN_GRADE, Math.ceil(evaluation.required - EPSILON)))
  return String(grade)
}

interface SimulationPanelProps {
  scenario: Scenario
  plan: Plan
}

/** Dettaglio dell'obiettivo selezionato: stato, barra e simulazione dei voti futuri. */
export function SimulationPanel({ scenario, plan }: SimulationPanelProps) {
  const { data, dispatch } = useAppState()
  const [confirmClear, setConfirmClear] = useState(false)
  const message = describeGoal(plan, data.settings.lodeValue)
  const evaluation = plan.evaluation
  const { future, projection } = plan
  const hasPredictions = Object.keys(scenario.predictions).length > 0
  const scenarioId = scenario.id

  const projectionHint =
    future.count === 0
      ? 'nessun esame da sostenere'
      : future.predictedCount === 0
        ? 'inserisci dei voti previsti qui sotto'
        : projection.complete
          ? 'con tutti i voti previsti'
          : `con voti previsti su ${formatCfu(future.predictedCfu)} di ${formatCfu(future.cfu)}`

  const requiredHint =
    future.count === 0
      ? 'nessun esame da sostenere'
      : future.freeCount === 0
        ? 'tutti i voti sono bloccati'
        : `in ${future.freeCount} ${future.freeCount === 1 ? 'esame' : 'esami'} (${formatCfu(future.freeCfu)})`

  return (
    <Card as="section" className={styles.panel} aria-labelledby="simulazione-titolo">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="simulazione-titolo" className={styles.panelTitle}>
            Simulazione · {scenarioLabel(scenario)}
          </h2>
          <p className={styles.panelSubtitle}>
            Ogni obiettivo ha la sua simulazione: i voti che inserisci qui valgono solo per questo.
          </p>
        </div>
        {hasPredictions && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Eraser size={16} aria-hidden="true" />}
            onClick={() => setConfirmClear(true)}
          >
            Svuota simulazione
          </Button>
        )}
      </div>

      {message && (
        <div className={styles.status} aria-live="polite">
          {message.status && <StatusBadge tone={message.tone}>{message.title}</StatusBadge>}
          <p>{message.detail}</p>
        </div>
      )}

      <GoalBar
        current={plan.passed.average}
        projected={projection.average}
        goal={scenario.goal.value}
        tone={message?.tone ?? 'neutral'}
      />

      <div className={styles.summary} aria-live="polite">
        <div className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Media finale prevista</p>
          <p className={styles.summaryValue}>{formatAverage(projection.average)}</p>
          <p className={styles.summaryHint}>{projectionHint}</p>
        </div>
        <div className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Ti serve negli esami non bloccati</p>
          <p className={styles.summaryValue}>{formatRequired(evaluation?.required ?? null)}</p>
          <p className={styles.summaryHint}>{requiredHint}</p>
        </div>
      </div>

      {data.futureExams.length === 0 ? (
        <p className={styles.empty}>
          Aggiungi gli <a href="#/futuri">esami da sostenere</a> per simulare i voti.
        </p>
      ) : (
        <>
          <p className={styles.help}>
            <strong>Voto previsto</strong>: un’ipotesi, cambia la media finale prevista.{' '}
            <strong>Lucchetto</strong>: il voto diventa un punto fermo e la media che ti serve si
            ricalcola sugli altri esami. Nei campi vuoti vedi il voto che ti servirebbe.
          </p>
          <SimulationTable
            exams={data.futureExams}
            predictions={scenario.predictions}
            suggestion={suggestedGrade(plan)}
            groupName={data.group.enabled ? data.group.name : undefined}
            onSet={(examId, grade, lode) =>
              dispatch({ type: 'prediction/set', scenarioId, examId, grade, lode })
            }
            onClear={(examId) => dispatch({ type: 'prediction/clear', scenarioId, examId })}
            onLock={(examId, locked) =>
              dispatch({ type: 'prediction/setLocked', scenarioId, examId, locked })
            }
          />
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Svuotare la simulazione?"
        message={`Verranno cancellati tutti i voti previsti e bloccati dell’obiettivo ${scenarioLabel(scenario)}. Gli altri obiettivi non cambiano.`}
        confirmLabel="Svuota"
        onConfirm={() => {
          dispatch({ type: 'prediction/clearAll', scenarioId })
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </Card>
  )
}
