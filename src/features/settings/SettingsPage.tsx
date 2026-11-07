import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Impostazioni"
        description="Personalizza come vengono calcolate le medie."
      />
      <Card variant="placeholder">
        Qui potrai scegliere quanto vale la lode nella media (milestone 2).
      </Card>
    </>
  )
}
