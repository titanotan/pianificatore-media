import { BookOpenCheck, Plus } from 'lucide-react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import styles from '../../components/ListPage.module.css'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { formatAverage, formatCfu, formatNumber } from '../../domain/format'
import { newId } from '../../domain/id'
import type { PassedExam } from '../../domain/types'
import { useEditorState } from '../../hooks/useEditorState'
import { useAppState } from '../../state/context'
import { PassedExamForm } from './PassedExamForm'
import { PassedExamTable } from './PassedExamTable'

export function PassedExamsPage() {
  const { data, dispatch, plan, group } = useAppState()
  const editor = useEditorState<PassedExam>()

  const exams = data.passedExams
  const lodeCount = exams.filter((e) => e.lode).length
  const { lodeValue } = data.settings

  const save = (values: Omit<PassedExam, 'id'>, addAnother: boolean) => {
    if (editor.editing) {
      dispatch({ type: 'passed/update', exam: { ...values, id: editor.editing.id } })
      editor.close()
      return
    }
    dispatch({ type: 'passed/add', exam: { ...values, id: newId() } })
    if (addAnother) editor.addedAnother(`«${values.name}» aggiunto. Inserisci il prossimo esame.`)
    else editor.close()
  }

  const confirmDelete = () => {
    if (editor.toDelete) dispatch({ type: 'passed/remove', id: editor.toDelete.id })
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
        title="Esami sostenuti"
        description="Il tuo libretto: voti, CFU e media ponderata, aggiornata a ogni modifica."
        actions={exams.length > 0 ? addButton : undefined}
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={<BookOpenCheck size={24} />}
          title="Nessun esame sostenuto"
          action={addButton}
        >
          Aggiungi gli esami che hai già superato, con CFU e voto: calcolerò la tua media ponderata
          e la userò per pianificare i prossimi.
        </EmptyState>
      ) : (
        <>
          <div className={styles.stats} aria-live="polite">
            <Stat
              label="Media ponderata"
              value={formatAverage(plan.passed.average)}
              hint={
                lodeCount > 0
                  ? `pesata sui CFU, lode = ${formatNumber(lodeValue)}`
                  : 'pesata sui CFU'
              }
              emphasis
            />
            <Stat label="CFU acquisiti" value={plan.passed.cfu} hint="totale crediti" />
            <Stat
              label="Esami"
              value={exams.length}
              hint={lodeCount === 1 ? '1 con lode' : `${lodeCount} con lode`}
            />
            {group && (
              <Stat
                label={`Media ${data.group.name}`}
                value={formatAverage(group.plan.passed.average)}
                hint={`su ${formatCfu(group.plan.passed.cfu)} del gruppo`}
              />
            )}
          </div>

          <PassedExamTable
            exams={exams}
            onEdit={editor.openEdit}
            onDelete={editor.askDelete}
            groupName={data.group.enabled ? data.group.name : undefined}
          />
          <p className={styles.footnote}>
            Totale: {formatCfu(plan.passed.cfu)} in {exams.length}{' '}
            {exams.length === 1 ? 'esame' : 'esami'}.
          </p>
        </>
      )}

      <Modal
        open={editor.isOpen}
        onClose={editor.close}
        title={editor.editing ? 'Modifica esame' : 'Aggiungi esame sostenuto'}
      >
        <PassedExamForm
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
              Vuoi eliminare <strong>{editor.toDelete.name}</strong> dal libretto? L’operazione non
              si può annullare.
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
