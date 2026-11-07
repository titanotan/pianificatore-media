import { useEffect, useMemo, type ReactNode } from 'react'
import { AppShell } from './app/AppShell'
import { StorageNotices } from './app/StorageNotices'
import { ROUTES, type RouteId } from './app/routes'
import { useHashRoute } from './app/useHashRoute'
import { useTheme } from './app/useTheme'
import { FutureExamsPage } from './features/future/FutureExamsPage'
import { GroupPage } from './features/group/GroupPage'
import { PassedExamsPage } from './features/passed/PassedExamsPage'
import { PlanningPage } from './features/planning/PlanningPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { useAppState } from './state/context'

const PAGES: Record<RouteId, () => ReactNode> = {
  piano: () => <PlanningPage />,
  gruppo: () => <GroupPage />,
  libretto: () => <PassedExamsPage />,
  futuri: () => <FutureExamsPage />,
  impostazioni: () => <SettingsPage />,
}

export default function App() {
  const route = useHashRoute()
  const { theme, toggle } = useTheme()
  const { data } = useAppState()
  const { enabled: groupEnabled, name: groupName } = data.group

  // La voce del gruppo compare solo se la funzione è attiva, con il nome scelto dall'utente
  const routes = useMemo(
    () =>
      ROUTES.filter((r) => r.id !== 'gruppo' || groupEnabled).map((r) =>
        r.id === 'gruppo' ? { ...r, label: groupName } : r,
      ),
    [groupEnabled, groupName],
  )

  useEffect(() => {
    const label = routes.find((r) => r.id === route)?.label
    document.title = label ? `${label} · Pianificatore Media` : 'Pianificatore Media'
  }, [route, routes])

  return (
    <AppShell route={route} routes={routes} theme={theme} onToggleTheme={toggle}>
      <StorageNotices />
      {PAGES[route]()}
    </AppShell>
  )
}
