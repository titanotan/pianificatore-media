import { Layers, Pencil, Target } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAverage, formatCfu, formatRequired } from '../../domain/format'
import { describeGoal } from '../../domain/messages'
import { scenarioLabel } from '../../domain/scenarios'
import { useAppState } from '../../state/context'
import styles from './GroupCard.module.css'
import { GroupGoalDialog } from './GroupGoalDialog'

/** Riquadro del gruppo di esami (solo se la funzione aggiuntiva è attiva). */
export function GroupCard() {
  const { data, groupPlan, activeScenario } = useAppState()
  const [goalOpen, setGoalOpen] = useState(false)
  if (!data.group.enabled || !groupPlan) return null

  const { group } = data
  const { passed, future, projection, evaluation } = groupPlan
  const message = describeGoal(groupPlan, data.settings.lodeValue)
  const isEmpty = passed.count + future.count === 0
  const hasPredictions = activeScenario !== null && future.predictedCount > 0

  return (
    <Card as="section" className={styles.card} aria-labelledby="gruppo-titolo">
      <div className={styles.header}>
        <div className={styles.heading}>
          <Layers size={20} className={styles.icon} aria-hidden="true" />
          <div>
            <h2 id="gruppo-titolo" className={styles.title}>
              {group.name}
            </h2>
            <p className={styles.subtitle}>
              Media calcolata solo sugli esami del gruppo, in aggiunta a quella generale.
            </p>
          </div>
        </div>
        {!isEmpty && (
          <Button
            size="sm"
            variant={group.goal ? 'ghost' : 'secondary'}
            icon={
              group.goal ? (
                <Pencil size={15} aria-hidden="true" />
              ) : (
                <Target size={15} aria-hidden="true" />
              )
            }
            onClick={() => setGoalOpen(true)}
          >
            {group.goal ? 'Modifica obiettivo' : 'Imposta obiettivo'}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <p className={styles.empty}>
          Nessun esame nel gruppo. Spunta «Nel gruppo» quando aggiungi o modifichi un esame nel{' '}
          <a href="#/libretto">libretto</a> o negli <a href="#/futuri">esami da sostenere</a>.
        </p>
      ) : (
        <>
          <dl className={styles.stats}>
            <div>
              <dt>Media attuale</dt>
              <dd className="num">{formatAverage(passed.average)}</dd>
              <p className={styles.hint}>
                su {formatCfu(passed.cfu)} ({passed.count} {passed.count === 1 ? 'esame' : 'esami'})
              </p>
            </div>
            <div>
              <dt>Media prevista</dt>
              <dd className="num">{formatAverage(hasPredictions ? projection.average : null)}</dd>
              <p className={styles.hint}>
                {hasPredictions
                  ? `con i voti di «${scenarioLabel(activeScenario!)}»`
                  : 'nessun voto previsto per il gruppo'}
              </p>
            </div>
            <div>
              <dt>Obiettivo</dt>
              <dd className="num">{formatAverage(group.goal?.value ?? null)}</dd>
              <p className={styles.hint}>{group.goal ? 'media del gruppo' : 'non impostato'}</p>
            </div>
            <div>
              <dt>Ti serve</dt>
              <dd className={`num ${styles.accent}`}>
                {formatRequired(evaluation?.required ?? null)}
              </dd>
              <p className={styles.hint}>
                {future.count === 0
                  ? 'nessun esame del gruppo da sostenere'
                  : future.freeCfu === 0
                    ? 'tutti i voti del gruppo sono bloccati'
                    : `in ${formatCfu(future.freeCfu)} del gruppo da sostenere`}
              </p>
            </div>
          </dl>

          {message && (
            <div className={styles.status} aria-live="polite">
              {message.status && <StatusBadge tone={message.tone}>{message.title}</StatusBadge>}
              <p>{message.detail}</p>
            </div>
          )}
        </>
      )}

      <GroupGoalDialog open={goalOpen} onClose={() => setGoalOpen(false)} />
    </Card>
  )
}
