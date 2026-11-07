import { CalendarClock, Plus } from 'lucide-react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { formatCfu } from '../../domain/format'
import { newId } from '../../domain/id'
import { DIFFICULTIES, type Difficulty, type FutureExam } from '../../domain/types'
import { useEditorState } from '../../hooks/useEditorState'
import { useAppState } from '../../state/context'
import styles from '../../components/ListPage.module.css'
import { FutureExamForm } from './FutureExamForm'
import { FutureExamTable } from './FutureExamTable'

const PLURAL: Record<Difficulty, [string, string]> = {
  easy: ['facile', 'facili'],
  medium: ['media', 'medie'],
  hard: ['difficile', 'difficili'],
}

export function FutureExamsPage() {
  const { data, dispatch, plan } = useAppState()
  const editor = useEditorState<FutureExam>()
  const exams = data.futureExams

  const difficultySummary = DIFFICULTIES.map((d) => {
    const count = exams.filter((e) => e.difficulty === d).length
    return count > 0 ? `${count} ${PLURAL[d][count === 1 ? 0 : 1]}` : null
  })
    .filter(Boolean)
    .join(' · ')

  const save = (values: Omit<FutureExam, 'id'>, addAnother: boolean) => {
    if (editor.editing) {
      dispatch({ type: 'future/update', exam: { ...values, id: editor.editing.id } })
      editor.close()
      return
    }
    dispatch({ type: 'future/add', exam: { ...values, id: newId() } })
    if (addAnother) editor.addedAnother(`«${values.name}» aggiunto. Inserisci il prossimo esame.`)
    else editor.close()
  }

  const confirmDelete = () => {
    if (editor.toDelete) dispatch({ type: 'future/remove', id: editor.toDelete.id })
    editor.cancelDelete()
  }

  const addButton = (
    <Button variant="primary" icon={<Plus size={18} aria-hidden="true" />} onClick={editor.openAdd}>
      Aggiungi esame
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Esami da sostenere"
        description="Gli esami che ti mancano: su questi si calcola la media che ti serve."
        actions={exams.length > 0 ? addButton : undefined}
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={24} />}
          title="Nessun esame da sostenere"
          action={addButton}
        >
          Elenca gli esami che ti mancano, con CFU e difficoltà prevista: calcolerò che media ti
          serve per raggiungere il tuo obiettivo.
        </EmptyState>
      ) : (
        <>
          <div className={styles.stats} aria-live="polite">
            <Stat label="CFU rimanenti" value={plan.future.cfu} hint="da sostenere" emphasis />
            <Stat label="Esami" value={exams.length} hint={difficultySummary} />
            <Stat
              label="CFU totali"
              value={plan.totalCfu}
              hint={`${formatCfu(plan.passed.cfu)} già acquisiti`}
            />
          </div>

          <FutureExamTable
            exams={exams}
            onEdit={editor.openEdit}
            onDelete={editor.askDelete}
            groupName={data.group.enabled ? data.group.name : undefined}
          />
          <p className={styles.footnote}>
            Totale: {formatCfu(plan.future.cfu)} in {exams.length}{' '}
            {exams.length === 1 ? 'esame' : 'esami'}. Imposta l’obiettivo e simula i voti nella{' '}
            <a href="#/piano">Pianificazione</a>.
          </p>
        </>
      )}

      <Modal
        open={editor.isOpen}
        onClose={editor.close}
        title={editor.editing ? 'Modifica esame' : 'Aggiungi esame da sostenere'}
      >
        <FutureExamForm
          key={editor.formKey}
          initial={editor.editing}
          notice={editor.notice}
          onSave={save}
          onCancel={editor.close}
          groupName={data.group.enabled ? data.group.name : undefined}
        />
      </Modal>

      <ConfirmDialog
        open={editor.toDelete !== null}
        title="Eliminare l’esame?"
        message={
          editor.toDelete && (
            <>
              Vuoi eliminare <strong>{editor.toDelete.name}</strong> dagli esami da sostenere?
              {data.scenarios.some((s) => editor.toDelete && s.predictions[editor.toDelete.id]) &&
                ' Verranno eliminati anche i suoi voti previsti nelle simulazioni.'}{' '}
              L’operazione non si può annullare.
            </>
          )
        }
        confirmLabel="Elimina"
        onConfirm={confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </>
  )
}
