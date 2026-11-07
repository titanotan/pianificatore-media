import { describe, expect, it } from 'vitest'
import {
  isValidDate,
  validateCfu,
  validateFutureExam,
  validateGoalAverage,
  validateGrade,
  validateLodeValue,
  validateName,
  validatePassedExam,
} from './validation'

describe('validateName', () => {
  it('pulisce gli spazi', () => {
    expect(validateName('  Analisi   II ')).toEqual({ value: 'Analisi II' })
  })

  it('rifiuta nomi vuoti o troppo lunghi', () => {
    expect(validateName('   ').error).toBe('Inserisci il nome dell’esame.')
    expect(validateName('x'.repeat(81)).error).toMatch(/al massimo 80/)
  })
})

describe('validateCfu', () => {
  it('accetta interi tra 1 e 30', () => {
    expect(validateCfu('6')).toEqual({ value: 6 })
    expect(validateCfu('1').value).toBe(1)
    expect(validateCfu('30').value).toBe(30)
  })

  it('spiega cosa non va', () => {
    expect(validateCfu('').error).toBe('Inserisci i CFU.')
    expect(validateCfu('6,5').error).toBe('I CFU devono essere un numero intero.')
    expect(validateCfu('sei').error).toBe('I CFU devono essere un numero intero.')
    expect(validateCfu('0').error).toBe('I CFU devono essere tra 1 e 30.')
    expect(validateCfu('31').error).toBe('I CFU devono essere tra 1 e 30.')
  })
})

describe('validateGrade', () => {
  it('accetta interi tra 18 e 30', () => {
    expect(validateGrade('18').value).toBe(18)
    expect(validateGrade('30').value).toBe(30)
  })

  it('spiega cosa non va', () => {
    expect(validateGrade('').error).toBe('Inserisci il voto.')
    expect(validateGrade('17').error).toBe('Il voto deve essere tra 18 e 30.')
    expect(validateGrade('31').error).toBe('Il voto deve essere tra 18 e 30.')
    expect(validateGrade('27.5').error).toBe('Il voto deve essere un numero intero.')
  })
})

describe('validateLodeValue', () => {
  it('accetta valori tra 30 e 33, anche decimali', () => {
    expect(validateLodeValue('30').value).toBe(30)
    expect(validateLodeValue('31,5').value).toBe(31.5)
    expect(validateLodeValue('33').value).toBe(33)
  })

  it('rifiuta valori fuori intervallo', () => {
    expect(validateLodeValue('29').error).toMatch(/tra 30 e 33/)
    expect(validateLodeValue('34').error).toMatch(/tra 30 e 33/)
    expect(validateLodeValue('').error).toMatch(/tra 30 e 33/)
  })
})

describe('validateGoalAverage', () => {
  it('accetta medie tra 18 e 30 con al massimo due decimali', () => {
    expect(validateGoalAverage('27,5').value).toBe(27.5)
    expect(validateGoalAverage('28.25').value).toBe(28.25)
    expect(validateGoalAverage('30').value).toBe(30)
  })

  it('spiega cosa non va', () => {
    expect(validateGoalAverage('').error).toBe('Inserisci la media che vuoi raggiungere.')
    expect(validateGoalAverage('ventisette').error).toMatch(/numero/)
    expect(validateGoalAverage('31').error).toBe('La media obiettivo deve essere tra 18 e 30.')
    expect(validateGoalAverage('17,9').error).toBe('La media obiettivo deve essere tra 18 e 30.')
    expect(validateGoalAverage('27,555').error).toBe('Usa al massimo due decimali.')
  })
})

describe('isValidDate', () => {
  it('accetta solo date reali nel formato AAAA-MM-GG', () => {
    expect(isValidDate('2026-02-28')).toBe(true)
    expect(isValidDate('2024-02-29')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('28/02/2026')).toBe(false)
    expect(isValidDate(20260228)).toBe(false)
  })
})

describe('validatePassedExam', () => {
  const valid = { name: 'Analisi I', cfu: '9', grade: '30', lode: true, date: '' }

  it('restituisce l’esame pulito se tutto è valido', () => {
    expect(validatePassedExam(valid)).toEqual({
      ok: true,
      value: { name: 'Analisi I', cfu: 9, grade: 30, lode: true },
    })
  })

  it('segna l’esame nel gruppo solo se richiesto', () => {
    const inGroup = validatePassedExam({ ...valid, inGroup: true })
    expect(inGroup.ok && inGroup.value.inGroup).toBe(true)
    const notInGroup = validatePassedExam({ ...valid, inGroup: false })
    expect(notInGroup.ok && 'inGroup' in notInGroup.value).toBe(false)
  })

  it('conserva la data se presente', () => {
    const result = validatePassedExam({ ...valid, date: '2026-06-15' })
    expect(result.ok && result.value.date).toBe('2026-06-15')
  })

  it('segnala la lode senza 30', () => {
    const result = validatePassedExam({ ...valid, grade: '28' })
    expect(result).toEqual({ ok: false, errors: { lode: 'La lode è possibile solo con 30.' } })
  })

  it('raccoglie tutti gli errori in una volta', () => {
    const result = validatePassedExam({
      name: '',
      cfu: '0',
      grade: '15',
      lode: false,
      date: 'ieri',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['cfu', 'date', 'grade', 'name'])
    }
  })
})

describe('validateFutureExam', () => {
  it('restituisce l’esame pulito se tutto è valido', () => {
    expect(validateFutureExam({ name: ' Fisica ', cfu: '12', difficulty: 'hard' })).toEqual({
      ok: true,
      value: { name: 'Fisica', cfu: 12, difficulty: 'hard' },
    })
  })

  it('segnala una difficoltà non valida', () => {
    const result = validateFutureExam({ name: 'Fisica', cfu: '12', difficulty: 'boh' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.difficulty).toMatch(/facile, media o difficile/)
  })
})
