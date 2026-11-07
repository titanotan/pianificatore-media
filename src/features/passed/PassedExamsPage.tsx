import { BookOpenCheck, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { formatAverage, formatCfu, formatNumber } from '../../domain/format'
import { newId } from '../../domain/id'
import type { PassedExam } from '../../domain/types'
import { useAppState } from '../../state/context'
import { PassedExamForm } from './PassedExamForm'
import { PassedExamTable } from './PassedExamTable'
import styles from './PassedExamsPage.module.css'

type Editor = { mode: 'add' } | { mode: 'edit'; exam: PassedExam } | null

export function PassedExamsPage() {
  const { data, dispatch, plan } = useAppState()
  const [editor, setEditor] = useState<Editor>(null)
  const [toDelete, setToDelete] = useState<PassedExam | null>(null)
  // Cambiando la chiave il modulo riparte vuoto (dopo "Salva e aggiungi un altro")
  const [formKey, setFormKey] = useState(0)
  const [addedNotice, setAddedNotice] = useState<string | null>(null)

  const exams = data.passedExams
  const lodeCount = exams.filter((e) => e.lode).length
  const { lodeValue } = data.settings

  const openAdd = () => {
    setAddedNotice(null)
    setEditor({ mode: 'add' })
  }

  const closeEditor = () => {
    setEditor(null)
    setAddedNotice(null)
  }

  const save = (values: Omit<PassedExam, 'id'>, addAnother: boolean) => {
    if (editor?.mode === 'edit') {
      dispatch({ type: 'passed/update', exam: { ...values, id: editor.exam.id } })
      closeEditor()
      return
    }
    dispatch({ type: 'passed/add', exam: { ...values, id: newId() } })
    if (addAnother) {
      setAddedNotice(`«${values.name}» aggiunto. Inserisci il prossimo esame.`)
      setFormKey((k) => k + 1)
    } else {
      closeEditor()
    }
  }

  const confirmDelete = () => {
    if (toDelete) dispatch({ type: 'passed/remove', id: toDelete.id })
    setToDelete(null)
  }

  const addButton = (
    <Button variant="primary" icon={<Plus size={18} aria-hidden="true" />} onClick={openAdd}>
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
          </div>

          <PassedExamTable
            exams={exams}
            onEdit={(exam) => setEditor({ mode: 'edit', exam })}
            onDelete={setToDelete}
          />
          <p className={styles.footnote}>
            Totale: {formatCfu(plan.passed.cfu)} in {exams.length}{' '}
            {exams.length === 1 ? 'esame' : 'esami'}.
          </p>
        </>
      )}

      <Modal
        open={editor !== null}
        onClose={closeEditor}
        title={editor?.mode === 'edit' ? 'Modifica esame' : 'Aggiungi esame sostenuto'}
      >
        <PassedExamForm
          key={editor?.mode === 'edit' ? editor.exam.id : `new-${formKey}`}
          initial={editor?.mode === 'edit' ? editor.exam : undefined}
          notice={editor?.mode === 'add' ? addedNotice : null}
          onSave={save}
          onCancel={closeEditor}
        />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminare l’esame?"
        message={
          toDelete && (
            <>
              Vuoi eliminare <strong>{toDelete.name}</strong> dal libretto? L’operazione non si può
              annullare.
            </>
          )
        }
        confirmLabel="Elimina"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
