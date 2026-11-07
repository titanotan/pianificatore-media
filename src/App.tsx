import type { ReactNode } from 'react'
import { AppShell } from './app/AppShell'
import { StorageNotices } from './app/StorageNotices'
import type { RouteId } from './app/routes'
import { useHashRoute } from './app/useHashRoute'
import { useTheme } from './app/useTheme'
import { FutureExamsPage } from './features/future/FutureExamsPage'
import { PassedExamsPage } from './features/passed/PassedExamsPage'
import { PlanningPage } from './features/planning/PlanningPage'
import { SettingsPage } from './features/settings/SettingsPage'

const PAGES: Record<RouteId, () => ReactNode> = {
  piano: () => <PlanningPage />,
  libretto: () => <PassedExamsPage />,
  futuri: () => <FutureExamsPage />,
  impostazioni: () => <SettingsPage />,
}

export default function App() {
  const route = useHashRoute()
  const { theme, toggle } = useTheme()

  return (
    <AppShell route={route} theme={theme} onToggleTheme={toggle}>
      <StorageNotices />
      {PAGES[route]()}
    </AppShell>
  )
}
