import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/Field'
import { Modal, ModalActions } from '../../components/Modal'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAverage, formatNumber } from '../../domain/format'
import { newId } from '../../domain/id'
import { describeGoal } from '../../domain/messages'
import {
  planForScenario,
  scenarioLabel,
  sortScenarios,
  suggestGoals,
  validateScenarioGoal,
  type ScopeView,
} from '../../domain/scenarios'
import { MAX_GRADE, MIN_GRADE, type Scenario } from '../../domain/types'
import { useAppState } from '../../state/context'
import styles from './GoalDialog.module.css'

/** Cosa sta facendo la finestra: nuovo obiettivo (eventualmente copiando una simulazione) o modifica. */
export type GoalDialogMode =
  { mode: 'add'; copyFromId?: string } | { mode: 'edit'; scenario: Scenario } | null

interface GoalDialogProps {
  /** Ambito dell'obiettivo: media generale o gruppo di esami */
  view: ScopeView
  state: GoalDialogMode
  onClose: () => void
}

export function GoalDialog({ view, state, onClose }: GoalDialogProps) {
  const isEdit = state?.mode === 'edit'
  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={isEdit ? 'Modifica obiettivo' : 'Nuovo obiettivo'}
      description={
        view.scope === 'group'
          ? 'La media che vuoi avere negli esami del gruppo.'
          : 'La media ponderata che vuoi avere alla fine del percorso.'
      }
      size="sm"
    >
      {state && (
        <GoalForm
          key={state.mode === 'edit' ? state.scenario.id : `add-${state.copyFromId ?? ''}`}
          view={view}
          state={state}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

const EMPTY_COPY = ''

interface GoalFormProps {
  view: ScopeView
  state: NonNullable<GoalDialogMode>
  onClose: () => void
}

function GoalForm({ view, state, onClose }: GoalFormProps) {
  const { data, dispatch } = useAppState()
  const { scope, plan, scenarios } = view
  const editing = state.mode === 'edit' ? state.scenario : undefined
  const [value, setValue] = useState(editing ? formatNumber(editing.goal.value) : '')
  const [copyFrom, setCopyFrom] = useState(
    state.mode === 'add' ? (state.copyFromId ?? EMPTY_COPY) : EMPTY_COPY,
  )
  const [showError, setShowError] = useState(false)

  const result = validateScenarioGoal(value, scenarios, editing?.id)
  const source = scenarios.find((s) => s.id === copyFrom)
  const suggestions = editing
    ? []
    : suggestGoals(
        plan.passed.average,
        scenarios.map((s) => s.goal.value),
      )

  // Anteprima: cosa servirebbe con questo obiettivo (e i voti previsti che verrebbero usati)
  const previewScenario: Scenario | null =
    result.value === undefined
      ? null
      : {
          id: editing?.id ?? 'anteprima',
          name: '',
          goal: { kind: 'average', value: result.value },
          predictions: editing?.predictions ?? source?.predictions ?? {},
        }
  const preview = previewScenario
    ? describeGoal(planForScenario(data, previewScenario, scope), data.settings.lodeValue)
    : null

  const save = (goalValue: number) => {
    const goal = { kind: 'average' as const, value: goalValue }
    if (editing) {
      dispatch({ type: 'scenario/updateGoal', scope, id: editing.id, goal })
    } else {
      dispatch({
        type: 'scenario/add',
        scope,
        scenario: {
          id: newId(),
          name: '',
          goal,
          predictions: source ? structuredClone(source.predictions) : {},
        },
      })
    }
    onClose()
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (result.value === undefined) {
      setShowError(true)
      return
    }
    save(result.value)
  }

  const copyOptions = [
    { value: EMPTY_COPY, label: 'Nessuno: simulazione vuota' },
    ...sortScenarios(scenarios).map((s) => {
      const count = Object.keys(s.predictions).length
      return {
        value: s.id,
        label: `Copia da ${scenarioLabel(s)} (${count === 1 ? '1 voto' : `${count} voti`})`,
      }
    }),
  ]

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
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

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <p className={styles.suggestionsLabel}>
            {plan.passed.average !== null
              ? `Suggeriti (${scope === 'group' ? 'media del gruppo' : 'la tua media'}: ${formatAverage(plan.passed.average)}):`
              : 'Suggeriti:'}
          </p>
          <div className={styles.chips}>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.chip}
                aria-pressed={result.value === s}
                onClick={() => setValue(String(s))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {!editing && scenarios.length > 0 && (
        <SelectField
          label="Voti previsti"
          value={copyFrom}
          onChange={setCopyFrom}
          options={copyOptions}
          hint="Puoi partire dalla simulazione di un altro obiettivo e modificarla."
        />
      )}

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
        <Button onClick={onClose}>Annulla</Button>
        <Button type="submit" variant="primary">
          {editing ? 'Salva modifiche' : 'Aggiungi obiettivo'}
        </Button>
      </ModalActions>
    </form>
  )
}
