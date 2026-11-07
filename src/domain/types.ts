/**
 * Modello dei dati dell'app.
 * Tutto ciò che sta in src/domain/ è logica pura: niente React, niente browser, solo funzioni testabili.
 */

/** Voto minimo e massimo di un esame (escluso il valore della lode). */
export const MIN_GRADE = 18
export const MAX_GRADE = 30

/** Intervallo ammesso per il valore della lode nel calcolo della media. */
export const MIN_LODE_VALUE = 30
export const MAX_LODE_VALUE = 33
export const DEFAULT_LODE_VALUE = 30

/** CFU ammessi per un singolo esame. */
export const MIN_CFU = 1
export const MAX_CFU = 30

/** Sopra questa media necessaria l'obiettivo è considerato "al limite". */
export const TIGHT_THRESHOLD = 29

export const MAX_NAME_LENGTH = 80

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Media',
  hard: 'Difficile',
}

/** Esame già sostenuto (libretto). */
export interface PassedExam {
  id: string
  name: string
  cfu: number
  /** Voto da 18 a 30 */
  grade: number
  /** Ammessa solo con 30 */
  lode: boolean
  /** Data facoltativa (AAAA-MM-GG), utile in futuro per il grafico della media nel tempo */
  date?: string
  /** Fa parte del gruppo di esami (funzione aggiuntiva); assente = no */
  inGroup?: boolean
}

/** Esame ancora da sostenere. */
export interface FutureExam {
  id: string
  name: string
  cfu: number
  difficulty: Difficulty
  /** Fa parte del gruppo di esami (funzione aggiuntiva); assente = no */
  inGroup?: boolean
  // In futuro: sessionId per organizzare gli esami per sessione
}

/** Voto previsto per un esame futuro, all'interno di uno scenario. */
export interface Prediction {
  grade: number
  lode: boolean
  /**
   * Voto bloccato: viene considerato certo nel calcolo di "cosa serve negli esami restanti"
   * (e in futuro l'algoritmo di distribuzione non lo modificherà).
   */
  locked: boolean
}

/**
 * Uno scenario = un obiettivo con la sua simulazione indipendente.
 * L'utente può averne diversi (es. media 25, 26, 27) e confrontarli.
 */
export interface Scenario {
  id: string
  /** Nome facoltativo (in futuro: "prudente", "realistico", "ambizioso"); vuoto = si mostra la media */
  name: string
  goal: Goal
  /** Voti previsti indicizzati per id dell'esame futuro */
  predictions: Record<string, Prediction>
}

/** Numero massimo di obiettivi contemporanei. */
export const MAX_SCENARIOS = 10

export interface Settings {
  /** Quanto vale la lode nel calcolo della media (30–33) */
  lodeValue: number
}

/**
 * Obiettivo dell'utente. Per ora solo la media;
 * è un'unione per poter aggiungere in futuro altri tipi (es. voto di laurea).
 */
export type Goal = { kind: 'average'; value: number }

export interface AppData {
  passedExams: PassedExam[]
  futureExams: FutureExam[]
  settings: Settings
  /** Obiettivi, ciascuno con la sua simulazione */
  scenarios: Scenario[]
  /** Obiettivo selezionato nella Pianificazione; `null` se non ce ne sono */
  activeScenarioId: string | null
  /** Gruppo di esami (funzione aggiuntiva, spenta di default) */
  group: ExamGroup
}

/**
 * Gruppo ristretto di esami con una sua media (es. gli esami che l'ateneo usa per i punti
 * di laurea). Gli esami del gruppo restano anche nella media generale.
 */
export interface ExamGroup {
  /** Funzione attiva: se spenta, nell'interfaccia non compare nulla (i dati restano salvati) */
  enabled: boolean
  name: string
  goal: Goal | null
}

export const DEFAULT_GROUP_NAME = 'Gruppo di esami'
export const MAX_GROUP_NAME_LENGTH = 40

export function createDefaultGroup(): ExamGroup {
  return { enabled: false, name: DEFAULT_GROUP_NAME, goal: null }
}

export function createEmptyData(): AppData {
  return {
    passedExams: [],
    futureExams: [],
    settings: { lodeValue: DEFAULT_LODE_VALUE },
    scenarios: [],
    activeScenarioId: null,
    group: createDefaultGroup(),
  }
}
