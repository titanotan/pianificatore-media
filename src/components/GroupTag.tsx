import styles from './GroupTag.module.css'

/** Etichetta accanto al nome di un esame che fa parte del gruppo. */
export function GroupTag({ name }: { name: string }) {
  return (
    <span className={styles.tag} title={`Fa parte del gruppo «${name}»`}>
      <span className="sr-only">, nel gruppo </span>
      {name}
    </span>
  )
}
