import { BookOpenCheck, CalendarClock, Sparkles, Target } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { createDemoData } from '../../domain/demo'
import { useAppState } from '../../state/context'
import styles from './Welcome.module.css'

const STEPS = [
  {
    icon: BookOpenCheck,
    title: 'Inserisci gli esami sostenuti',
    text: 'Nome, CFU e voto (con l’eventuale lode): calcolo la tua media ponderata.',
    href: '#/libretto',
    action: 'Vai al libretto',
  },
  {
    icon: CalendarClock,
    title: 'Elenca gli esami da sostenere',
    text: 'Con i CFU e la difficoltà prevista: sono quelli su cui pianificare.',
    href: '#/futuri',
    action: 'Vai agli esami da sostenere',
  },
  {
    icon: Target,
    title: 'Imposta uno o più obiettivi',
    text: 'Vedrai la media che ti serve, potrai bloccare i voti di cui sei sicuro e generare combinazioni realistiche.',
  },
] as const

/** Schermata iniziale: compare finché non c'è nessun esame. */
export function Welcome() {
  const { data, dispatch } = useAppState()

  // L'esempio non tocca le impostazioni già scelte (lode, funzioni aggiuntive)
  const loadDemo = () =>
    dispatch({
      type: 'data/replace',
      data: { ...createDemoData(), settings: data.settings, group: data.group },
    })

  return (
    <div className={styles.welcome}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Benvenuto in Pianificatore Media</h1>
        <p className={styles.lead}>
          Non è un semplice libretto: ti dice <strong>quali voti ti servono</strong> nei prossimi
          esami per arrivare alla media che vuoi. Si comincia in tre passi.
        </p>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.title}>
              <Card className={styles.step}>
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <Icon size={22} className={styles.icon} aria-hidden="true" />
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepText}>{step.text}</p>
                {'href' in step && (
                  <a className={styles.stepLink} href={step.href}>
                    {step.action} →
                  </a>
                )}
              </Card>
            </li>
          )
        })}
      </ol>

      <Card className={styles.demo}>
        <Sparkles size={20} className={styles.icon} aria-hidden="true" />
        <div>
          <h2 className={styles.stepTitle}>Vuoi prima dare un’occhiata?</h2>
          <p className={styles.stepText}>
            Carica un percorso di esempio con esami e obiettivi già pronti. Quando vuoi iniziare con
            i tuoi dati, lo cancelli da Impostazioni → «Cancella tutti i dati».
          </p>
        </div>
        <Button onClick={loadDemo}>Carica un esempio</Button>
      </Card>

      <p className={styles.note}>
        I dati restano solo in questo browser: nessun account, nessun server. Il valore della lode e
        le funzioni aggiuntive sono in <a href="#/impostazioni">Impostazioni</a>.
      </p>
    </div>
  )
}
