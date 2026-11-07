import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article'
  variant?: 'default' | 'placeholder'
}

export function Card({ as: Tag = 'section', variant = 'default', className, ...rest }: CardProps) {
  const classes = [styles.card, variant === 'placeholder' && styles.placeholder, className]
    .filter(Boolean)
    .join(' ')
  return <Tag className={classes} {...rest} />
}
