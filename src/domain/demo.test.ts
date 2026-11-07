import { describe, expect, it } from 'vitest'
import { sanitizeAppData } from '../storage/sanitize'
import { createDemoData } from './demo'
import { planAllScenarios } from './scenarios'

describe('dati di esempio', () => {
  it('sono validi (nessun elemento scartato)', () => {
    expect(sanitizeAppData(createDemoData()).dropped).toBe(0)
  })

  it('mostrano obiettivi con stati diversi', () => {
    const statuses = planAllScenarios(createDemoData()).map((p) => p.plan.evaluation!.status)
    expect(new Set(statuses).size).toBeGreaterThan(1)
  })
})
