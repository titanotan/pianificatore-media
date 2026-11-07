import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Checkbox, TextField } from '../../components/Field'
import { ModalActions } from '../../components/Modal'
import { parseDecimal, todayIso } from '../../domain/format'
import { MAX_GRADE, MAX_CFU, MIN_GRADE, type PassedExam } from '../../domain/types'
import {
  validatePassedExam,
  type FieldErrors,
  type PassedExamField,
  type PassedExamForm as FormValues,
} from '../../domain/validation'
import styles from './PassedExamForm.module.css'

interface PassedExamFormProps {
  /** Esame da modificare; se assente il modulo serve ad aggiungerne uno nuovo */
  initial?: PassedExam
  /** Messaggio di conferma dopo "Salva e aggiungi un altro" */
  notice?: string | null
  onSave: (exam: Omit<PassedExam, 'id'>, addAnother: boolean) => void
  onCancel: () => void
}

const toForm = (exam?: PassedExam): FormValues => ({
  name: exam?.name ?? '',
  cfu: exam ? String(exam.cfu) : '',
  grade: exam ? String(exam.grade) : '',
  lode: exam?.lode ?? false,
  date: exam?.date ?? '',
})

export function PassedExamForm({ initial, notice, onSave, onCancel }: PassedExamFormProps) {
  const [values, setValues] = useState<FormValues>(() => toForm(initial))
  // Gli errori compaiono dopo il primo tentativo di salvataggio, poi si aggiornano mentre scrivi
  const [showErrors, setShowErrors] = useState(false)
  const isEdit = initial !== undefined

  const result = validatePassedExam(values)
  const errors: FieldErrors<PassedExamField> = showErrors && !result.ok ? result.errors : {}
  const lodeAvailable = parseDecimal(values.grade) === MAX_GRADE

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((current) => {
      const next = { ...current, [key]: value }
      // La lode ha senso solo con 30: se il voto cambia, la togliamo
      if (key === 'grade' && parseDecimal(String(value)) !== MAX_GRADE) next.lode = false
      return next
    })

  const submit = (addAnother: boolean) => {
    if (!result.ok) {
      setShowErrors(true)
      return
    }
    onSave(result.value, addAnother)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <div className={styles.grid}>
        <TextField
          className={styles.full}
          label="Nome dell’esame"
          value={values.name}
          onChange={(v) => update('name', v)}
          error={errors.name}
          placeholder="es. Analisi matematica I"
          autoComplete="off"
          // data-autofocus: focus all'apertura della finestra; autoFocus: dopo "aggiungi un altro"
          data-autofocus
          autoFocus
        />
        <TextField
          label="CFU"
          value={values.cfu}
          onChange={(v) => update('cfu', v)}
          error={errors.cfu}
          inputMode="numeric"
          placeholder="es. 9"
          hint={`Numero intero, al massimo ${MAX_CFU}`}
        />
        <TextField
          label="Voto"
          value={values.grade}
          onChange={(v) => update('grade', v)}
          error={errors.grade}
          inputMode="numeric"
          placeholder="es. 27"
          hint={`Da ${MIN_GRADE} a ${MAX_GRADE}`}
          suffix="/ 30"
        />
        <Checkbox
          label="Con lode"
          checked={values.lode}
          onChange={(v) => update('lode', v)}
          disabled={!lodeAvailable}
          error={errors.lode}
          hint={lodeAvailable ? undefined : 'Disponibile solo con 30'}
        />
        <TextField
          label="Data (facoltativa)"
          type="date"
          value={values.date}
          onChange={(v) => update('date', v)}
          error={errors.date}
          max={todayIso()}
        />
      </div>

      <ModalActions>
        <Button onClick={onCancel}>Annulla</Button>
        {!isEdit && <Button onClick={() => submit(true)}>Salva e aggiungi un altro</Button>}
        <Button type="submit" variant="primary">
          {isEdit ? 'Salva modifiche' : 'Aggiungi esame'}
        </Button>
      </ModalActions>
    </form>
  )
}
