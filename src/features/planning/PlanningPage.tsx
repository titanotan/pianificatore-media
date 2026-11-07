import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import styles from './PlanningPage.module.css'

export function PlanningPage() {
  return (
    <>
      <PageHeader
        title="Pianificazione"
        description="Scopri che voti ti servono negli esami che mancano per raggiungere il tuo obiettivo."
      />

      <div className={styles.stats}>
        <Stat label="Media attuale" value="—" hint="sugli esami sostenuti" />
        <Stat label="Obiettivo" value="—" hint="media da raggiungere" />
        <Stat label="Media necessaria" value="—" hint="negli esami rimanenti" emphasis />
        <Stat label="CFU rimanenti" value="—" hint="da sostenere" />
      </div>

      <Card variant="placeholder">
        Qui arriveranno lo stato dell’obiettivo e la simulazione dei voti futuri (milestone 4).
      </Card>
    </>
  )
}
