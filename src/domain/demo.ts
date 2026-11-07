/** Dati di esempio per esplorare l'app al primo avvio (si cancellano da Impostazioni). */
import { createEmptyData, type AppData } from './types'

export function createDemoData(): AppData {
  return {
    ...createEmptyData(),
    passedExams: [
      { id: 'demo-p1', name: 'Analisi matematica I', cfu: 12, grade: 24, lode: false },
      { id: 'demo-p2', name: 'Fondamenti di informatica', cfu: 9, grade: 28, lode: false },
      { id: 'demo-p3', name: 'Algebra lineare', cfu: 6, grade: 22, lode: false },
      { id: 'demo-p4', name: 'Fisica I', cfu: 9, grade: 25, lode: false },
      { id: 'demo-p5', name: 'Programmazione', cfu: 12, grade: 30, lode: true },
      { id: 'demo-p6', name: 'Inglese', cfu: 3, grade: 27, lode: false },
    ],
    futureExams: [
      { id: 'demo-f1', name: 'Analisi matematica II', cfu: 9, difficulty: 'hard' },
      { id: 'demo-f2', name: 'Basi di dati', cfu: 9, difficulty: 'easy' },
      { id: 'demo-f3', name: 'Reti di calcolatori', cfu: 6, difficulty: 'medium' },
      { id: 'demo-f4', name: 'Sistemi operativi', cfu: 9, difficulty: 'medium' },
      { id: 'demo-f5', name: 'Ingegneria del software', cfu: 9, difficulty: 'easy' },
      { id: 'demo-f6', name: 'Calcolo delle probabilità', cfu: 6, difficulty: 'hard' },
    ],
    scenarios: [
      { id: 'demo-s1', name: '', goal: { kind: 'average', value: 26 }, predictions: {} },
      { id: 'demo-s2', name: '', goal: { kind: 'average', value: 27 }, predictions: {} },
      { id: 'demo-s3', name: '', goal: { kind: 'average', value: 28 }, predictions: {} },
    ],
    activeScenarioId: 'demo-s1',
  }
}
