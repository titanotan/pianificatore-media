import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader } from '../../components/PageHeader'
import { SegmentedControl } from '../../components/SegmentedControl'
import { summarizePassedExams } from '../../domain/grades'
import { formatAverage, formatNumber } from '../../domain/format'
import { MAX_LODE_VALUE, MIN_LODE_VALUE } from '../../domain/types'
import { useAppState } from '../../state/context'
import styles from './SettingsPage.module.css'

const LODE_OPTIONS = Array.from({ length: MAX_LODE_VALUE - MIN_LODE_VALUE + 1 }, (_, i) => {
  const value = MIN_LODE_VALUE + i
  return { value, label: String(value) }
})

export function SettingsPage() {
  const { data, dispatch, plan, persistent } = useAppState()
  const [confirmReset, setConfirmReset] = useState(false)
  const { lodeValue } = data.settings
  const lodeCount = data.passedExams.filter((e) => e.lode).length
  const hasData =
    data.passedExams.length > 0 || data.futureExams.length > 0 || data.scenarios.length > 0

  // Anteprima: media che avresti con ciascun valore della lode
  const previews = LODE_OPTIONS.map(({ value }) => ({
    value,
    average: summarizePassedExams(data.passedExams, { lodeValue: value }).average,
  }))

  return (
    <>
      <PageHeader
        title="Impostazioni"
        description="Personalizza come vengono calcolate le medie."
      />

      <div className={styles.sections}>
        <Card>
          <h2 className={styles.title}>Valore della lode</h2>
          <p className={styles.text}>
            Quanto vale un 30 e lode nel calcolo della media. Dipende dal tuo ateneo: spesso vale
            30, in alcuni corsi 31, 32 o 33. Controlla il regolamento del tuo corso di laurea.
          </p>

          <div className={styles.control}>
            <SegmentedControl
              label="Valore della lode"
              options={LODE_OPTIONS}
              value={lodeValue}
              onChange={(value) =>
                dispatch({ type: 'settings/update', settings: { lodeValue: value } })
              }
            />
          </div>

          {lodeCount > 0 ? (
            <>
              <p className={styles.text} aria-live="polite">
                Con la lode a <strong>{formatNumber(lodeValue)}</strong> la tua media attuale è{' '}
                <strong className="num">{formatAverage(plan.passed.average)}</strong> (
                {lodeCount === 1 ? '1 esame con lode' : `${lodeCount} esami con lode`}).
              </p>
              <ul className={styles.previews} aria-label="Media con ciascun valore della lode">
                {previews.map((p) => (
                  <li key={p.value} data-active={p.value === lodeValue || undefined}>
                    <span>Lode = {p.value}</span>
                    <span className="num">{formatAverage(p.average)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.muted}>
              Non hai ancora esami con lode: il valore conterà quando ne aggiungerai uno (anche nei
              voti previsti della simulazione).
            </p>
          )}
        </Card>

        <Card>
          <h2 className={styles.title}>I tuoi dati</h2>
          <p className={styles.text}>
            {persistent
              ? 'I dati sono salvati solo in questo browser, su questo dispositivo: nessun account, nessun server. Se cancelli i dati di navigazione del sito, li perdi.'
              : 'Questo browser non permette di salvare i dati (ad esempio in navigazione privata): andranno persi alla chiusura della pagina.'}
          </p>
          <div className={styles.control}>
            <Button
              variant="secondary"
              icon={<Trash2 size={16} aria-hidden="true" />}
              onClick={() => setConfirmReset(true)}
              disabled={!hasData}
              className={styles.dangerButton}
            >
              Cancella tutti i dati
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Cancellare tutti i dati?"
        message="Verranno eliminati esami sostenuti, esami da sostenere, obiettivi con le loro simulazioni e impostazioni. L’operazione non si può annullare."
        confirmLabel="Cancella tutto"
        onConfirm={() => {
          dispatch({ type: 'data/reset' })
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  )
}
