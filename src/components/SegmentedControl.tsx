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
}

/** Scelta tra poche opzioni, come pulsanti affiancati (gruppo di radio accessibile). */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset className={styles.group}>
      <legend className="sr-only">{label}</legend>
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
    </fieldset>
  )
}
