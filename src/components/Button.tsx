import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  /** Icona a sinistra del testo */
  icon?: ReactNode
  /** Solo icona: in questo caso `aria-label` è obbligatorio per l'accessibilità */
  iconOnly?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconOnly = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      title={iconOnly ? rest['aria-label'] : undefined}
      {...rest}
    >
      {icon}
      {!iconOnly && children}
    </button>
  )
}
