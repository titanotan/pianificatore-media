import { describe, expect, it } from 'vitest'
import { createEmptyData, type AppData } from '../domain/types'
import {
  SCHEMA_VERSION,
  UnsupportedVersionError,
  migrate,
  migrateV1toV2,
  migrateV2toV3,
} from './migrations'
import { sanitizeAppData } from './sanitize'
import {
  BACKUP_STORAGE_KEY,
  DATA_STORAGE_KEY,
  createMemoryStorage,
  loadData,
  saveData,
} from './storage'

const sampleData = (): AppData => ({
  ...createEmptyData(),
  passedExams: [
    { id: 'p1', name: 'Analisi I', cfu: 9, grade: 30, lode: true, date: '2025-02-10' },
    { id: 'p2', name: 'Programmazione', cfu: 12, grade: 27, lode: false },
  ],
  futureExams: [{ id: 'f1', name: 'Fisica', cfu: 12, difficulty: 'hard' }],
  settings: { lodeValue: 31 },
  scenarios: [
    {
      id: 's1',
      name: '',
      goal: { kind: 'average', value: 27.5 },
      predictions: { f1: { grade: 26, lode: false, locked: true } },
    },
    { id: 's2', name: 'Ambizioso', goal: { kind: 'average', value: 28 }, predictions: {} },
  ],
  activeScenarioId: 's2',
})

const stored = (data: unknown, version = SCHEMA_VERSION) => ({
  [DATA_STORAGE_KEY]: JSON.stringify({ version, data }),
})

describe('salvataggio e caricamento', () => {
  it('primo avvio: dati vuoti', () => {
    const result = loadData(createMemoryStorage())
    expect(result.status).toBe('empty')
    expect(result.data).toEqual(createEmptyData())
  })

  it('i dati salvati si rileggono identici', () => {
    const storage = createMemoryStorage()
    expect(saveData(storage, sampleData())).toBe(true)
    const result = loadData(storage)
    expect(result.status).toBe('loaded')
    expect(result.data).toEqual(sampleData())
  })

  it('salva insieme ai dati il numero di versione', () => {
    const storage = createMemoryStorage()
    saveData(storage, sampleData())
    expect(JSON.parse(storage.dump()[DATA_STORAGE_KEY]).version).toBe(SCHEMA_VERSION)
  })

  it('JSON rovinato: riparte da zero ma conserva una copia di sicurezza', () => {
    const storage = createMemoryStorage({ [DATA_STORAGE_KEY]: '{non è json' })
    const result = loadData(storage)
    expect(result.status).toBe('error')
    expect(result.data).toEqual(createEmptyData())
    expect(result.message).toMatch(/copia di sicurezza/)
    expect(storage.dump()[BACKUP_STORAGE_KEY]).toBe('{non è json')
  })

  it('dati di una versione più recente dell’app: non li tocca, ne fa il backup', () => {
    const storage = createMemoryStorage(stored(sampleData(), SCHEMA_VERSION + 1))
    const result = loadData(storage)
    expect(result.status).toBe('error')
    expect(result.message).toMatch(/più recente/)
    expect(storage.dump()[BACKUP_STORAGE_KEY]).toBe(storage.dump()[DATA_STORAGE_KEY])
  })

  it('elementi non validi: li scarta, tiene il resto e lo segnala', () => {
    const data = {
      ...sampleData(),
      passedExams: [
        ...sampleData().passedExams,
        { id: 'bad', name: 'Voto impossibile', cfu: 6, grade: 35, lode: false },
      ],
    }
    const result = loadData(createMemoryStorage(stored(data)))
    expect(result.status).toBe('recovered')
    expect(result.data.passedExams.map((e) => e.id)).toEqual(['p1', 'p2'])
    expect(result.message).toMatch(/ignorati \(1\)/)
  })

  it('storage che non permette di scrivere: saveData restituisce false', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(saveData(storage, sampleData())).toBe(false)
  })
})

describe('sanitizeAppData', () => {
  it('dati validi: nessuno scarto', () => {
    expect(sanitizeAppData(sampleData())).toEqual({ data: sampleData(), dropped: 0 })
  })

  it('valore non oggetto: dati vuoti', () => {
    expect(sanitizeAppData('ciao').data).toEqual(createEmptyData())
  })

  it('corregge la lode senza 30 e la difficoltà mancante', () => {
    const { data } = sanitizeAppData({
      passedExams: [{ id: 'a', name: 'A', cfu: 6, grade: 28, lode: true }],
      futureExams: [{ id: 'b', name: 'B', cfu: 6 }],
    })
    expect(data.passedExams[0].lode).toBe(false)
    expect(data.futureExams[0].difficulty).toBe('medium')
  })

  it('scarta id duplicati, previsioni orfane, obiettivi e impostazioni non validi', () => {
    const { data, dropped } = sanitizeAppData({
      passedExams: [
        { id: 'a', name: 'A', cfu: 6, grade: 28, lode: false },
        { id: 'a', name: 'A bis', cfu: 6, grade: 28, lode: false },
      ],
      futureExams: [{ id: 'f', name: 'F', cfu: 6, difficulty: 'easy' }],
      settings: { lodeValue: 40 },
      scenarios: [
        { id: 'bad', name: '', goal: { kind: 'average', value: 50 }, predictions: {} },
        {
          id: 's',
          name: 'S',
          goal: { kind: 'average', value: 27 },
          predictions: {
            f: { grade: 29, lode: false, locked: true },
            orfano: { grade: 29, lode: false, locked: true },
          },
        },
      ],
      activeScenarioId: 'inesistente',
    })
    expect(data.passedExams).toHaveLength(1)
    expect(data.settings.lodeValue).toBe(30)
    expect(data.scenarios.map((s) => s.id)).toEqual(['s'])
    expect(data.scenarios[0].predictions).toEqual({ f: { grade: 29, lode: false, locked: true } })
    expect(data.activeScenarioId).toBe('s')
    expect(dropped).toBe(3) // esame duplicato + lode non valida + obiettivo non valido
  })

  it('senza obiettivi: nessuno scenario e nessuna selezione', () => {
    const { data } = sanitizeAppData({ passedExams: [], futureExams: [] })
    expect(data.scenarios).toEqual([])
    expect(data.activeScenarioId).toBeNull()
  })

  it('tiene al massimo 10 obiettivi', () => {
    const scenarios = Array.from({ length: 12 }, (_, i) => ({
      id: `s${i}`,
      name: '',
      goal: { kind: 'average', value: 18 + i },
      predictions: {},
    }))
    const { data, dropped } = sanitizeAppData({ scenarios })
    expect(data.scenarios).toHaveLength(10)
    expect(dropped).toBe(2)
  })
})

describe('migrazione v1 → v2 (da un obiettivo a più obiettivi)', () => {
  const v1 = {
    passedExams: [{ id: 'p1', name: 'Analisi', cfu: 9, grade: 26, lode: false }],
    futureExams: [{ id: 'f1', name: 'Fisica', cfu: 12, difficulty: 'hard' }],
    settings: { lodeValue: 30 },
    goal: { kind: 'average', value: 27 },
    scenarios: [
      {
        id: 'default',
        name: 'Simulazione',
        predictions: { f1: { grade: 28, lode: false, locked: true } },
      },
    ],
    activeScenarioId: 'default',
  }

  it('l’obiettivo esistente diventa il primo scenario, con i suoi voti previsti', () => {
    expect(migrateV1toV2(v1)).toEqual({
      passedExams: v1.passedExams,
      futureExams: v1.futureExams,
      settings: v1.settings,
      scenarios: [
        {
          id: 'default',
          name: '',
          goal: { kind: 'average', value: 27 },
          predictions: { f1: { grade: 28, lode: false, locked: true } },
        },
      ],
      activeScenarioId: 'default',
    })
  })

  it('senza obiettivo: nessuno scenario', () => {
    const migrated = migrateV1toV2({ ...v1, goal: null }) as Record<string, unknown>
    expect(migrated.scenarios).toEqual([])
    expect(migrated.activeScenarioId).toBeNull()
    expect('goal' in migrated).toBe(false)
  })

  it('dati salvati con la v1 si caricano senza perdere nulla', () => {
    const storage = createMemoryStorage(stored(v1, 1))
    const result = loadData(storage)
    expect(result.status).toBe('loaded')
    expect(result.data.passedExams).toHaveLength(1)
    expect(result.data.scenarios[0].goal.value).toBe(27)
    expect(result.data.scenarios[0].predictions.f1.locked).toBe(true)
    // Al salvataggio successivo i dati sono nel formato nuovo
    saveData(storage, result.data)
    expect(JSON.parse(storage.dump()[DATA_STORAGE_KEY]).version).toBe(SCHEMA_VERSION)
    // ...e hanno il gruppo di esami, spento
    expect(result.data.group).toEqual({ enabled: false, name: 'Gruppo di esami', goal: null })
  })
})

describe('migrazione v2 → v3 (gruppo di esami)', () => {
  it('aggiunge il gruppo spento, senza toccare il resto', () => {
    const v2 = { passedExams: [], futureExams: [], scenarios: [], activeScenarioId: null }
    expect(migrateV2toV3(v2)).toEqual({
      ...v2,
      group: { enabled: false, name: 'Gruppo di esami', goal: null },
    })
  })
})

describe('gruppo di esami nei dati salvati', () => {
  it('conserva appartenenza al gruppo, nome e obiettivo', () => {
    const data = {
      ...sampleData(),
      passedExams: [{ id: 'p', name: 'P', cfu: 6, grade: 28, lode: false, inGroup: true }],
      group: { enabled: true, name: 'Caratterizzanti', goal: { kind: 'average', value: 27 } },
    }
    const { data: clean, dropped } = sanitizeAppData(data)
    expect(dropped).toBe(0)
    expect(clean.passedExams[0].inGroup).toBe(true)
    expect(clean.group).toEqual(data.group)
  })

  it('valori non validi: gruppo spento con nome predefinito', () => {
    const { data } = sanitizeAppData({
      futureExams: [{ id: 'f', name: 'F', cfu: 6, difficulty: 'easy', inGroup: 'sì' }],
      group: { enabled: 'yes', name: '', goal: { kind: 'average', value: 99 } },
    })
    expect(data.futureExams[0].inGroup).toBeUndefined()
    expect(data.group).toEqual({ enabled: false, name: 'Gruppo di esami', goal: null })
  })
})

describe('migrate', () => {
  it('dati già alla versione corrente: invariati', () => {
    const data = sampleData()
    expect(migrate(data, SCHEMA_VERSION)).toBe(data)
  })

  it('applica le migrazioni in sequenza', () => {
    const migrations = {
      1: (d: unknown) => ({ ...(d as object), sessions: [] }),
      2: (d: unknown) => ({ ...(d as object), migratedTo3: true }),
    }
    expect(migrate({ a: 1 }, 1, 3, migrations)).toEqual({ a: 1, sessions: [], migratedTo3: true })
  })

  it('errore se manca una migrazione o la versione non è valida', () => {
    expect(() => migrate({}, 1, 2, {})).toThrow(UnsupportedVersionError)
    expect(() => migrate({}, 0)).toThrow(UnsupportedVersionError)
    expect(() => migrate({}, Number.NaN)).toThrow(UnsupportedVersionError)
    expect(() => migrate({}, SCHEMA_VERSION + 1)).toThrow(/più recente/)
  })
})
