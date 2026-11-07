import { useState } from 'react'
import { Card } from '../../components/Card'
import { Checkbox, TextField } from '../../components/Field'
import { validateGroupName } from '../../domain/group'
import { MAX_GROUP_NAME_LENGTH } from '../../domain/types'
import { useAppState } from '../../state/context'
import styles from './SettingsPage.module.css'

/**
 * Funzioni aggiuntive: per ora il gruppo di esami. Spento di default:
 * finché non lo attivi, nel resto dell'app non compare nulla.
 */
export function GroupSettings() {
  const { data, dispatch } = useAppState()
  const { group } = data
  const [name, setName] = useState(group.name)
  const [previousName, setPreviousName] = useState(group.name)
  // Se il nome cambia da fuori (es. "Cancella tutti i dati"), il campo si allinea
  if (group.name !== previousName) {
    setPreviousName(group.name)
    if (validateGroupName(name).value !== group.name) setName(group.name)
  }
  const nameResult = validateGroupName(name)
  const count =
    data.passedExams.filter((e) => e.inGroup).length +
    data.futureExams.filter((e) => e.inGroup).length

  const onNameChange = (value: string) => {
    setName(value)
    const result = validateGroupName(value)
    if (result.value !== undefined)
      dispatch({ type: 'group/update', group: { name: result.value } })
  }

  return (
    <Card>
      <h2 className={styles.title}>Funzioni aggiuntive</h2>
      <p className={styles.text}>
        Strumenti opzionali, utili solo per alcuni regolamenti d’ateneo.
      </p>

      <div className={styles.feature}>
        <Checkbox
          label="Gruppo di esami"
          checked={group.enabled}
          onChange={(enabled) => dispatch({ type: 'group/update', group: { enabled } })}
        />
        <p className={styles.featureText}>
          Calcola anche la media di un gruppo ristretto di esami, ad esempio quelli che il tuo
          ateneo usa per assegnare i punti di laurea, con un suo obiettivo. Gli esami del gruppo
          restano anche nella media generale.
        </p>

        {group.enabled && (
          <div className={styles.featureBody}>
            <TextField
              label="Nome del gruppo"
              value={name}
              onChange={onNameChange}
              error={nameResult.error}
              maxLength={MAX_GROUP_NAME_LENGTH + 10}
              hint="Es. Esami caratterizzanti"
              autoComplete="off"
            />
            <p className={styles.muted}>
              {count === 0
                ? 'Nessun esame nel gruppo: aggiungili spuntando «Nel gruppo» quando inserisci o modifichi un esame.'
                : `${count === 1 ? '1 esame' : `${count} esami`} nel gruppo. Trovi media, obiettivi e simulazioni del gruppo nella sua pagina, nel menu.`}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
