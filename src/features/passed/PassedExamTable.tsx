import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/Button'
import { GroupTag } from '../../components/GroupTag'
import { formatDate } from '../../domain/format'
import type { PassedExam } from '../../domain/types'
import styles from '../../components/ExamTable.module.css'

interface PassedExamTableProps {
  exams: readonly PassedExam[]
  onEdit: (exam: PassedExam) => void
  onDelete: (exam: PassedExam) => void
  /** Nome del gruppo di esami, se la funzione è attiva */
  groupName?: string
}

/** Elenco degli esami sostenuti: tabella su computer, schede su smartphone. */
export function PassedExamTable({ exams, onEdit, onDelete, groupName }: PassedExamTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="sr-only">Esami sostenuti</caption>
        <thead>
          <tr>
            <th scope="col">Esame</th>
            <th scope="col" className={styles.numeric}>
              CFU
            </th>
            <th scope="col" className={styles.numeric}>
              Voto
            </th>
            <th scope="col">Data</th>
            <th scope="col">
              <span className="sr-only">Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id}>
              <th scope="row" className={styles.name}>
                {exam.name}
                {groupName && exam.inGroup && <GroupTag name={groupName} />}
              </th>
              <td className={`${styles.meta} ${styles.numeric} num`}>
                {exam.cfu}
                {/* Su smartphone CFU e data stanno sulla stessa riga, sotto il nome */}
                <span className={styles.mobileOnly} aria-hidden="true">
                  {' '}
                  CFU{exam.date && ` · ${formatDate(exam.date)}`}
                </span>
              </td>
              <td className={`${styles.aside} ${styles.numeric}`}>
                <span className={exam.lode ? `${styles.badge} ${styles.lode}` : styles.badge}>
                  {exam.grade}
                  {exam.lode && <span className={styles.lodeMark}>L</span>}
                </span>
                {exam.lode && <span className="sr-only"> e lode</span>}
              </td>
              <td className={`${styles.muted} ${styles.hideOnMobile}`}>{formatDate(exam.date)}</td>
              <td className={styles.actions}>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Modifica ${exam.name}`}
                  icon={<Pencil size={16} aria-hidden="true" />}
                  onClick={() => onEdit(exam)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Elimina ${exam.name}`}
                  icon={<Trash2 size={16} aria-hidden="true" />}
                  onClick={() => onDelete(exam)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
