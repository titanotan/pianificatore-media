import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Field.module.css'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: ReactNode
  /** Testo a destra del campo, es. "CFU" */
  suffix?: string
}

/** Campo di testo con etichetta, suggerimento e messaggio d'errore accanto. */
export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  suffix,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control} data-invalid={error ? true : undefined}>
        <input
          id={id}
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

interface CheckboxProps {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  hint?: ReactNode
  error?: string
}

export function Checkbox({ label, checked, onChange, disabled, hint, error }: CheckboxProps) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.checkbox} data-disabled={disabled ? true : undefined}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={hint || error ? `${id}-desc` : undefined}
        />
        <span>{label}</span>
      </label>
      {(error || hint) && (
        <p id={`${id}-desc`} className={error ? styles.error : styles.hint}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
