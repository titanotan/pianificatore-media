import type { ReactNode } from 'react'
import { Nav } from '../components/Nav'
import { ThemeToggle } from '../components/ThemeToggle'
import type { RouteId } from './routes'
import type { Theme } from './theme'
import styles from './AppShell.module.css'

interface AppShellProps {
  route: RouteId
  theme: Theme
  onToggleTheme: () => void
  children: ReactNode
}

function Brand() {
  return (
    <a href="#/piano" className={styles.brand}>
      <img src="./favicon.svg" alt="" width={28} height={28} />
      <span>Pianificatore Media</span>
    </a>
  )
}

/**
 * Struttura della pagina.
 * Computer: menu laterale fisso a sinistra. Smartphone: barra in alto (logo + tema) e menu in basso.
 */
export function AppShell({ route, theme, onToggleTheme, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a href="#contenuto" className={styles.skipLink}>
        Vai al contenuto
      </a>

      <header className={styles.topbar}>
        <Brand />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Brand />
        </div>
        <Nav current={route} />
        <div className={styles.sidebarFooter}>
          <span>Tema</span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </aside>

      <main id="contenuto" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
