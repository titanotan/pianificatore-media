import { describe, expect, it } from 'vitest'
import { parseRoute, routeHref } from './routes'

describe('parseRoute', () => {
  it('riconosce le sezioni valide', () => {
    expect(parseRoute('#/piano')).toBe('piano')
    expect(parseRoute('#/libretto')).toBe('libretto')
    expect(parseRoute('#/futuri')).toBe('futuri')
    expect(parseRoute('#/impostazioni')).toBe('impostazioni')
    expect(parseRoute('#/gruppo')).toBe('gruppo')
  })

  it('accetta varianti senza barra, maiuscole e sotto-percorsi', () => {
    expect(parseRoute('#libretto')).toBe('libretto')
    expect(parseRoute('#/LIBRETTO')).toBe('libretto')
    expect(parseRoute('#/futuri/123')).toBe('futuri')
    expect(parseRoute('#/futuri?x=1')).toBe('futuri')
  })

  it('torna alla pianificazione per hash vuoti o sconosciuti', () => {
    expect(parseRoute('')).toBe('piano')
    expect(parseRoute('#')).toBe('piano')
    expect(parseRoute('#/')).toBe('piano')
    expect(parseRoute('#/inesistente')).toBe('piano')
  })
})

describe('routeHref', () => {
  it('costruisce un hash che parseRoute rilegge uguale', () => {
    expect(routeHref('futuri')).toBe('#/futuri')
    expect(parseRoute(routeHref('impostazioni'))).toBe('impostazioni')
  })
})
