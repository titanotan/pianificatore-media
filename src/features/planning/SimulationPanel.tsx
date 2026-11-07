import { Dices, Eraser } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAverage, formatCfu, formatRequired } from '../../domain/format'
import { describeGoal } from '../../domain/messages'
import { generatePredictions } from '../../domain/distribution'
import { EPSILON } from '../../domain/planning'
import { scenarioLabel, type ScopeView } from '../../domain/scenarios'
import type { Plan } from '../../domain/simulation'
import { MAX_GRADE, MIN_GRADE, type Prediction, type Scenario } from '../../domain/types'
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
  /** Ambito (media generale o gruppo): dice quali esami simulare e dove salvare i voti */
  view: ScopeView
  scenario: Scenario
}

/** Dettaglio dell'obiettivo selezionato: stato, barra e simulazione dei voti futuri. */
export function SimulationPanel({ view, scenario }: SimulationPanelProps) {
  const { data, dispatch } = useAppState()
  const { scope, plan, futureExams } = view
  const [confirmClear, setConfirmClear] = useState(false)
  // Ultima generazione di voti: per mostrarne l'esito e poterla annullare
  const [generated, setGenerated] = useState<{
    previous: Record<string, Prediction>
    reachable: boolean
    useDifficulty: boolean
  } | null>(null)
  const message = describeGoal(plan, data.settings.lodeValue)
  const evaluation = plan.evaluation
  const { future, projection } = plan
  const hasPredictions = Object.keys(scenario.predictions).length > 0
  const scenarioId = scenario.id
  const required = evaluation?.required ?? null
  const useDifficulty = data.settings.difficultyInGeneration !== false

  const generate = () => {
    if (required === null) return
    const result = generatePredictions(futureExams, scenario.predictions, required, {
      useDifficulty,
    })
    setGenerated({ previous: scenario.predictions, reachable: result.reachable, useDifficulty })
    dispatch({ type: 'prediction/replaceAll', scope, scenarioId, predictions: result.predictions })
  }

  const undoGenerate = () => {
    if (!generated) return
    dispatch({ type: 'prediction/replaceAll', scope, scenarioId, predictions: generated.previous })
    setGenerated(null)
  }

  /** Ogni modifica a mano chiude il messaggio della generazione (niente annullamenti a sorpresa). */
  const manual =
    <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A) => {
      setGenerated(null)
      fn(...args)
    }

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
    <Card as="section" className={styles.panel} aria-labelledby={`simulazione-${scope}`}>
      <div className={styles.panelHeader}>
        <div>
          <h2 id={`simulazione-${scope}`} className={styles.panelTitle}>
            Simulazione · {scenarioLabel(scenario)}
          </h2>
          <p className={styles.panelSubtitle}>
            Ogni obiettivo ha la sua simulazione: i voti che inserisci qui valgono solo per questo.
          </p>
        </div>
        <div className={styles.panelActions}>
          {futureExams.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Dices size={16} aria-hidden="true" />}
              onClick={generate}
              disabled={required === null}
              title={
                required === null
                  ? 'Tutti i voti sono bloccati: sblocca un esame per generare i voti'
                  : 'Riempie gli esami non bloccati con voti variati che raggiungono l’obiettivo'
              }
            >
              Genera voti
            </Button>
          )}
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
          {futureExams.length > 0 && (
            <label className={styles.difficultyToggle}>
              <input
                type="checkbox"
                checked={useDifficulty}
                onChange={(event) =>
                  dispatch({
                    type: 'settings/update',
                    settings: { difficultyInGeneration: event.target.checked },
                  })
                }
              />
              Tieni conto della difficoltà
            </label>
          )}
        </div>
      </div>

      {generated && (
        <div
          className={
            generated.reachable ? styles.generated : `${styles.generated} ${styles.generatedWarn}`
          }
          role="status"
        >
          <p>
            {!generated.reachable
              ? 'L’obiettivo non è raggiungibile: ho messo 30 in tutti gli esami non bloccati.'
              : generated.useDifficulty
                ? 'Voti generati negli esami non bloccati: più alti nei facili, più bassi nei difficili. Premi di nuovo per un’altra combinazione, o modificali a mano.'
                : 'Voti generati negli esami non bloccati, senza considerare la difficoltà. Premi di nuovo per un’altra combinazione, o modificali a mano.'}
          </p>
          <Button size="sm" variant="ghost" onClick={undoGenerate}>
            Annulla
          </Button>
        </div>
      )}

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

      {futureExams.length === 0 ? (
        <p className={styles.empty}>
          {scope === 'group' ? (
            <>
              Nessun esame del gruppo da sostenere: spunta «Nel gruppo» negli{' '}
              <a href="#/futuri">esami da sostenere</a> per simularne i voti.
            </>
          ) : (
            <>
              Aggiungi gli <a href="#/futuri">esami da sostenere</a> per simulare i voti.
            </>
          )}
        </p>
      ) : (
        <>
          <p className={styles.help}>
            <strong>Voto previsto</strong>: un’ipotesi, cambia la media finale prevista.{' '}
            <strong>Lucchetto</strong>: il voto diventa un punto fermo e la media che ti serve si
            ricalcola sugli altri esami. Nei campi vuoti vedi il voto che ti servirebbe.{' '}
            <strong>Genera voti</strong>: propone voti realistici negli esami non bloccati.
          </p>
          <SimulationTable
            exams={futureExams}
            predictions={scenario.predictions}
            suggestion={suggestedGrade(plan)}
            groupName={scope === 'main' && data.group.enabled ? data.group.name : undefined}
            onSet={manual((examId: string, grade: number, lode: boolean) =>
              dispatch({ type: 'prediction/set', scope, scenarioId, examId, grade, lode }),
            )}
            onClear={manual((examId: string) =>
              dispatch({ type: 'prediction/clear', scope, scenarioId, examId }),
            )}
            onLock={manual((examId: string, locked: boolean) =>
              dispatch({ type: 'prediction/setLocked', scope, scenarioId, examId, locked }),
            )}
          />
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Svuotare la simulazione?"
        message={`Verranno cancellati tutti i voti previsti e bloccati dell’obiettivo ${scenarioLabel(scenario)}. Gli altri obiettivi non cambiano.`}
        confirmLabel="Svuota"
        onConfirm={() => {
          dispatch({ type: 'prediction/clearAll', scope, scenarioId })
          setConfirmClear(false)
          setGenerated(null)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </Card>
  )
}
