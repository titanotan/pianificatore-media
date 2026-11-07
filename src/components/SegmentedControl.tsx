import { useId } from 'react'
import styles from './SegmentedControl.module.css'

interface Option<T extends string | number> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string | number> {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  /** Mostra l'etichetta sopra i pulsanti (nei moduli); altrimenti è solo per gli screen reader */
  visibleLabel?: boolean
}

/** Scelta tra poche opzioni, come pulsanti affiancati (gruppo di radio accessibile). */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  visibleLabel = false,
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset className={visibleLabel ? styles.withLabel : styles.plain}>
      <legend className={visibleLabel ? styles.legend : 'sr-only'}>{label}</legend>
      <div className={styles.group}>
        {options.map((option) => (
          <label key={String(option.value)} className={styles.option}>
            <input
              type="radio"
              name={name}
              className={styles.radio}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.text}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
