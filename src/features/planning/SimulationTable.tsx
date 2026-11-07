import { Lock, LockOpen } from 'lucide-react'
import { DifficultyBadge } from '../../components/DifficultyBadge'
import tableStyles from '../../components/ExamTable.module.css'
import { MAX_GRADE, type FutureExam, type Prediction } from '../../domain/types'
import { GradeInput } from './GradeInput'
import styles from './Simulation.module.css'

interface SimulationTableProps {
  exams: readonly FutureExam[]
  predictions: Readonly<Record<string, Prediction>>
  /** Voto suggerito per gli esami senza voto previsto (es. "28") */
  suggestion?: string
  onSet: (examId: string, grade: number, lode: boolean) => void
  onClear: (examId: string) => void
  onLock: (examId: string, locked: boolean) => void
}

/** Esami futuri con voto previsto, lode e lucchetto: ogni modifica aggiorna subito i calcoli. */
export function SimulationTable({
  exams,
  predictions,
  suggestion,
  onSet,
  onClear,
  onLock,
}: SimulationTableProps) {
  return (
    <div className={`${tableStyles.wrapper} ${styles.tableWrapper}`}>
      <table className={`${tableStyles.table} ${styles.table}`}>
        <caption className="sr-only">Simulazione dei voti negli esami da sostenere</caption>
        <thead>
          <tr>
            <th scope="col">Esame</th>
            <th scope="col" className={tableStyles.numeric}>
              CFU
            </th>
            <th scope="col">Difficoltà</th>
            <th scope="col">Voto previsto</th>
            <th scope="col">Lode</th>
            <th scope="col">Blocca</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => {
            const prediction = predictions[exam.id]
            const locked = prediction?.locked ?? false
            const lodeEnabled = prediction?.grade === MAX_GRADE
            return (
              <tr key={exam.id} data-locked={locked || undefined}>
                <th scope="row" className={`${tableStyles.name} ${styles.examName}`}>
                  {exam.name}
                </th>
                <td className={`${tableStyles.numeric} ${styles.cfu} num`}>
                  {exam.cfu}
                  <span className={tableStyles.mobileOnly} aria-hidden="true">
                    {' '}
                    CFU
                  </span>
                </td>
                <td className={styles.difficulty}>
                  <DifficultyBadge difficulty={exam.difficulty} />
                </td>
                <td className={styles.grade}>
                  <GradeInput
                    grade={prediction?.grade}
                    placeholder={suggestion}
                    label={`Voto previsto per ${exam.name}`}
                    onSet={(grade) => onSet(exam.id, grade, prediction?.lode ?? false)}
                    onClear={() => onClear(exam.id)}
                  />
                </td>
                <td className={styles.lode}>
                  <label className={styles.lodeLabel} data-disabled={!lodeEnabled || undefined}>
                    <input
                      type="checkbox"
                      checked={prediction?.lode ?? false}
                      disabled={!lodeEnabled}
                      onChange={(event) =>
                        prediction && onSet(exam.id, prediction.grade, event.target.checked)
                      }
                      aria-label={`Lode per ${exam.name}`}
                    />
                    <span className={tableStyles.mobileOnly} aria-hidden="true">
                      Lode
                    </span>
                  </label>
                </td>
                <td className={styles.lock}>
                  <button
                    type="button"
                    className={styles.lockButton}
                    aria-pressed={locked}
                    disabled={!prediction}
                    onClick={() => onLock(exam.id, !locked)}
                    aria-label={
                      locked ? `Sblocca il voto di ${exam.name}` : `Blocca il voto di ${exam.name}`
                    }
                    title={
                      !prediction
                        ? 'Inserisci un voto previsto per poterlo bloccare'
                        : locked
                          ? 'Voto bloccato: clic per sbloccare'
                          : 'Blocca il voto'
                    }
                  >
                    {locked ? (
                      <Lock size={16} aria-hidden="true" />
                    ) : (
                      <LockOpen size={16} aria-hidden="true" />
                    )}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
