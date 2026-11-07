import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'

export function PassedExamsPage() {
  return (
    <>
      <PageHeader
        title="Esami sostenuti"
        description="Il tuo libretto: voti, CFU e media ponderata."
      />
      <Card variant="placeholder">
        Qui potrai aggiungere, modificare ed eliminare gli esami (milestone 2).
      </Card>
    </>
  )
}
