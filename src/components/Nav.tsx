import { BookOpenCheck, CalendarClock, Settings, Target, type LucideIcon } from 'lucide-react'
import { ROUTES, routeHref, type RouteId } from '../app/routes'
import styles from './Nav.module.css'

const ICONS: Record<RouteId, LucideIcon> = {
  piano: Target,
  libretto: BookOpenCheck,
  futuri: CalendarClock,
  impostazioni: Settings,
}

interface NavProps {
  current: RouteId
}

/** Menu principale: verticale nel menu laterale, orizzontale nella barra in basso su smartphone. */
export function Nav({ current }: NavProps) {
  return (
    <nav aria-label="Sezioni" className={styles.nav}>
      <ul className={styles.list}>
        {ROUTES.map(({ id, label, shortLabel }) => {
          const Icon = ICONS[id]
          const active = id === current
          return (
            <li key={id}>
              <a
                href={routeHref(id)}
                className={styles.link}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={styles.icon} size={20} strokeWidth={1.9} aria-hidden="true" />
                <span className={styles.label}>{label}</span>
                <span className={styles.shortLabel} aria-hidden="true">
                  {shortLabel}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
