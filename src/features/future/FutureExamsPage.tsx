import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'

export function FutureExamsPage() {
  return (
    <>
      <PageHeader
        title="Esami da sostenere"
        description="Gli esami che ti mancano, con CFU e difficoltà."
      />
      <Card variant="placeholder">
        Qui potrai elencare gli esami futuri e impostare il tuo obiettivo (milestone 3).
      </Card>
    </>
  )
}
