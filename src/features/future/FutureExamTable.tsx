import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/Button'
import { GroupTag } from '../../components/GroupTag'
import { DifficultyBadge } from '../../components/DifficultyBadge'
import styles from '../../components/ExamTable.module.css'
import type { FutureExam } from '../../domain/types'

interface FutureExamTableProps {
  exams: readonly FutureExam[]
  onEdit: (exam: FutureExam) => void
  onDelete: (exam: FutureExam) => void
  /** Nome del gruppo di esami, se la funzione è attiva */
  groupName?: string
}

export function FutureExamTable({ exams, onEdit, onDelete, groupName }: FutureExamTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="sr-only">Esami da sostenere</caption>
        <thead>
          <tr>
            <th scope="col">Esame</th>
            <th scope="col" className={styles.numeric}>
              CFU
            </th>
            <th scope="col">Difficoltà</th>
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
                <span className={styles.mobileOnly} aria-hidden="true">
                  {' '}
                  CFU
                </span>
              </td>
              <td className={styles.aside}>
                <DifficultyBadge difficulty={exam.difficulty} />
              </td>
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
