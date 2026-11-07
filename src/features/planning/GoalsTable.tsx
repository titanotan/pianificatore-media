import { CopyPlus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/Button'
import tableStyles from '../../components/ExamTable.module.css'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAverage, formatRequired } from '../../domain/format'
import { STATUS_LABELS, STATUS_TONES } from '../../domain/messages'
import { scenarioLabel, type ScenarioPlan } from '../../domain/scenarios'
import type { Scenario } from '../../domain/types'
import styles from './GoalsTable.module.css'

interface GoalsTableProps {
  items: readonly ScenarioPlan[]
  activeId: string | null
  canDuplicate: boolean
  onSelect: (scenario: Scenario) => void
  onEdit: (scenario: Scenario) => void
  onDuplicate: (scenario: Scenario) => void
  onDelete: (scenario: Scenario) => void
}

function simulationSummary({ plan }: ScenarioPlan): string {
  const { predictedCount, lockedCount } = plan.future
  if (predictedCount === 0) return 'nessun voto previsto'
  const predicted = predictedCount === 1 ? '1 voto previsto' : `${predictedCount} voti previsti`
  if (lockedCount === 0) return predicted
  return `${predicted}, ${lockedCount === 1 ? '1 bloccato' : `${lockedCount} bloccati`}`
}

/** Confronto tra gli obiettivi: clic su una riga per vederne la simulazione. */
export function GoalsTable({
  items,
  activeId,
  canDuplicate,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: GoalsTableProps) {
  return (
    <div className={`${tableStyles.wrapper} ${styles.wrapper}`}>
      <table className={`${tableStyles.table} ${styles.table}`}>
        <caption className="sr-only">Confronto tra i tuoi obiettivi</caption>
        <thead>
          <tr>
            <th scope="col">Obiettivo</th>
            <th scope="col" className={tableStyles.numeric}>
              Ti serve
            </th>
            <th scope="col">Stato</th>
            <th scope="col">Simulazione</th>
            <th scope="col">
              <span className="sr-only">Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const { scenario, plan } = item
            const active = scenario.id === activeId
            const evaluation = plan.evaluation
            const label = scenarioLabel(scenario)
            return (
              <tr
                key={scenario.id}
                data-active={active || undefined}
                onClick={() => onSelect(scenario)}
                className={styles.row}
              >
                <th scope="row" className={`${tableStyles.name} ${styles.goal}`}>
                  <button
                    type="button"
                    className={styles.select}
                    aria-pressed={active}
                    aria-label={`Mostra la simulazione per ${label}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(scenario)
                    }}
                  >
                    <span className={styles.radio} aria-hidden="true" />
                    <span className="num">{formatAverage(scenario.goal.value)}</span>
                    {scenario.name.trim() && (
                      <span className={styles.name}>{scenario.name.trim()}</span>
                    )}
                  </button>
                </th>
                <td className={`${tableStyles.numeric} ${styles.required} num`}>
                  <span className={tableStyles.mobileOnly}>serve </span>
                  {evaluation?.required != null
                    ? formatRequired(evaluation.required)
                    : evaluation
                      ? `finale ${formatAverage(evaluation.minFinal)}`
                      : '—'}
                </td>
                <td className={styles.status}>
                  {evaluation ? (
                    <StatusBadge tone={STATUS_TONES[evaluation.status]}>
                      {STATUS_LABELS[evaluation.status]}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Mancano esami</StatusBadge>
                  )}
                </td>
                <td className={`${tableStyles.muted} ${tableStyles.hideOnMobile}`}>
                  {simulationSummary(item)}
                </td>
                <td className={tableStyles.actions} onClick={(event) => event.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={`Modifica obiettivo ${label}`}
                    icon={<Pencil size={16} aria-hidden="true" />}
                    onClick={() => onEdit(scenario)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={`Duplica obiettivo ${label}`}
                    icon={<CopyPlus size={16} aria-hidden="true" />}
                    onClick={() => onDuplicate(scenario)}
                    disabled={!canDuplicate}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={`Elimina obiettivo ${label}`}
                    icon={<Trash2 size={16} aria-hidden="true" />}
                    onClick={() => onDelete(scenario)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
