import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../app/theme'
import styles from './ThemeToggle.module.css'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const label = theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? (
        <Sun size={18} strokeWidth={1.9} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.9} aria-hidden="true" />
      )}
    </button>
  )
}
