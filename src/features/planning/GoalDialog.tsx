import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Field'
import { Modal, ModalActions } from '../../components/Modal'
import { StatusBadge } from '../../components/StatusBadge'
import { formatNumber } from '../../domain/format'
import { describeGoal } from '../../domain/messages'
import { computePlan } from '../../domain/simulation'
import { MAX_GRADE, MIN_GRADE } from '../../domain/types'
import { validateGoalAverage } from '../../domain/validation'
import { useAppState } from '../../state/context'
import { getActiveScenario } from '../../state/reducer'
import styles from './GoalDialog.module.css'

interface GoalDialogProps {
  open: boolean
  onClose: () => void
}

export function GoalDialog({ open, onClose }: GoalDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Il tuo obiettivo"
      description="La media ponderata che vuoi avere alla fine del percorso."
      size="sm"
    >
      <GoalForm onClose={onClose} />
    </Modal>
  )
}

function GoalForm({ onClose }: { onClose: () => void }) {
  const { data, dispatch } = useAppState()
  const [value, setValue] = useState(data.goal ? formatNumber(data.goal.value) : '')
  const [showError, setShowError] = useState(false)

  const result = validateGoalAverage(value)

  // Anteprima: cosa servirebbe con l'obiettivo che stai scrivendo
  const preview =
    result.value === undefined
      ? null
      : describeGoal(
          computePlan({
            passedExams: data.passedExams,
            futureExams: data.futureExams,
            predictions: getActiveScenario(data).predictions,
            settings: data.settings,
            goal: { kind: 'average', value: result.value },
          }),
          data.settings.lodeValue,
        )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (result.value === undefined) {
      setShowError(true)
      return
    }
    dispatch({ type: 'goal/set', goal: { kind: 'average', value: result.value } })
    onClose()
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextField
        label="Media obiettivo"
        value={value}
        onChange={setValue}
        error={showError ? result.error : undefined}
        inputMode="decimal"
        placeholder="es. 27,5"
        hint={`Da ${MIN_GRADE} a ${MAX_GRADE}, anche con decimali`}
        suffix="/ 30"
        autoComplete="off"
        data-autofocus
      />

      <div className={styles.preview} aria-live="polite">
        {preview ? (
          <>
            {preview.status && <StatusBadge tone={preview.tone}>{preview.title}</StatusBadge>}
            <p>{preview.detail}</p>
          </>
        ) : (
          <p className={styles.muted}>Scrivi una media per vedere subito cosa ti servirebbe.</p>
        )}
      </div>

      <ModalActions>
        {data.goal && (
          <Button
            variant="ghost"
            className={styles.remove}
            onClick={() => {
              dispatch({ type: 'goal/clear' })
              onClose()
            }}
          >
            Rimuovi obiettivo
          </Button>
        )}
        <Button onClick={onClose}>Annulla</Button>
        <Button type="submit" variant="primary">
          Salva obiettivo
        </Button>
      </ModalActions>
    </form>
  )
}
