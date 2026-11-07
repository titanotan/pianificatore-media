import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Field'
import { ModalActions } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  MAX_CFU,
  type Difficulty,
  type FutureExam,
} from '../../domain/types'
import {
  validateFutureExam,
  type FieldErrors,
  type FutureExamField,
  type FutureExamForm as FormValues,
} from '../../domain/validation'
import styles from '../../components/ExamForm.module.css'

const DIFFICULTY_OPTIONS = DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))

interface FutureExamFormProps {
  initial?: FutureExam
  notice?: string | null
  onSave: (exam: Omit<FutureExam, 'id'>, addAnother: boolean) => void
  onCancel: () => void
}

export function FutureExamForm({ initial, notice, onSave, onCancel }: FutureExamFormProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    name: initial?.name ?? '',
    cfu: initial ? String(initial.cfu) : '',
    difficulty: initial?.difficulty ?? 'medium',
  }))
  const [showErrors, setShowErrors] = useState(false)
  const isEdit = initial !== undefined

  const result = validateFutureExam(values)
  const errors: FieldErrors<FutureExamField> = showErrors && !result.ok ? result.errors : {}

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

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
          placeholder="es. Fisica II"
          autoComplete="off"
          data-autofocus
          autoFocus
        />
        <TextField
          label="CFU"
          value={values.cfu}
          onChange={(v) => update('cfu', v)}
          error={errors.cfu}
          inputMode="numeric"
          placeholder="es. 6"
          hint={`Numero intero, al massimo ${MAX_CFU}`}
        />
        <div>
          <SegmentedControl<Difficulty>
            label="Difficoltà prevista"
            visibleLabel
            options={DIFFICULTY_OPTIONS}
            value={values.difficulty as Difficulty}
            onChange={(v) => update('difficulty', v)}
          />
        </div>
      </div>
      <p className={styles.help}>
        Per ora la difficoltà è solo un promemoria: in futuro servirà a proporti una distribuzione
        dei voti realistica.
      </p>

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
