import { useId, useState } from 'react'
import { parseDecimal } from '../../domain/format'
import { MAX_GRADE, MIN_GRADE } from '../../domain/types'
import { isValidGrade } from '../../domain/validation'
import styles from './Simulation.module.css'

interface GradeInputProps {
  /** Voto previsto attuale (undefined = nessun voto) */
  grade: number | undefined
  /** Suggerimento mostrato quando il campo è vuoto (es. il voto che serve) */
  placeholder?: string
  label: string
  onSet: (grade: number) => void
  onClear: () => void
}

const parseGrade = (text: string): number | undefined => {
  const value = parseDecimal(text)
  return value !== null && isValidGrade(value) ? value : undefined
}

/**
 * Campo compatto per il voto previsto: aggiorna la simulazione a ogni tasto
 * appena il voto è valido; se non lo è, lo segnala senza perdere quello che stai scrivendo.
 */
export function GradeInput({ grade, placeholder, label, onSet, onClear }: GradeInputProps) {
  const id = useId()
  const [text, setText] = useState(grade === undefined ? '' : String(grade))
  const [previous, setPrevious] = useState(grade)

  // Se il voto cambia da fuori (es. "Svuota simulazione"), il campo si allinea
  if (grade !== previous) {
    setPrevious(grade)
    if (parseGrade(text) !== grade) setText(grade === undefined ? '' : String(grade))
  }

  const invalid = text.trim() !== '' && parseGrade(text) === undefined

  const onChange = (next: string) => {
    setText(next)
    if (next.trim() === '') {
      onClear()
      return
    }
    const value = parseGrade(next)
    if (value !== undefined) onSet(value)
  }

  return (
    <span className={styles.gradeField}>
      <input
        className={styles.gradeInput}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        autoComplete="off"
      />
      {invalid && (
        <span id={`${id}-error`} className={styles.gradeError} role="alert">
          {MIN_GRADE}–{MAX_GRADE}
        </span>
      )}
    </span>
  )
}
