import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Field'
import { Modal, ModalActions } from '../../components/Modal'
import { StatusBadge } from '../../components/StatusBadge'
import { formatNumber } from '../../domain/format'
import { planForGroup } from '../../domain/group'
import { describeGoal } from '../../domain/messages'
import { MAX_GRADE, MIN_GRADE } from '../../domain/types'
import { validateGoalAverage } from '../../domain/validation'
import { useAppState } from '../../state/context'
import styles from './GoalDialog.module.css'

interface GroupGoalDialogProps {
  open: boolean
  onClose: () => void
}

export function GroupGoalDialog({ open, onClose }: GroupGoalDialogProps) {
  const { data } = useAppState()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Obiettivo · ${data.group.name}`}
      description="La media che vuoi avere negli esami del gruppo."
      size="sm"
    >
      <GroupGoalForm onClose={onClose} />
    </Modal>
  )
}

function GroupGoalForm({ onClose }: { onClose: () => void }) {
  const { data, dispatch, activeScenario } = useAppState()
  const current = data.group.goal
  const [value, setValue] = useState(current ? formatNumber(current.value) : '')
  const [showError, setShowError] = useState(false)
  const result = validateGoalAverage(value)

  // Anteprima con l'obiettivo che stai scrivendo (e i voti dell'obiettivo generale selezionato)
  const preview =
    result.value === undefined
      ? null
      : describeGoal(
          planForGroup(
            { ...data, group: { ...data.group, goal: { kind: 'average', value: result.value } } },
            activeScenario,
          ),
          data.settings.lodeValue,
        )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (result.value === undefined) {
      setShowError(true)
      return
    }
    dispatch({ type: 'group/update', group: { goal: { kind: 'average', value: result.value } } })
    onClose()
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <TextField
        label="Media obiettivo del gruppo"
        value={value}
        onChange={setValue}
        error={showError ? result.error : undefined}
        inputMode="decimal"
        placeholder="es. 27"
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
        {current && (
          <Button
            variant="ghost"
            className={styles.remove}
            onClick={() => {
              dispatch({ type: 'group/update', group: { goal: null } })
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
