/** Genera un identificativo univoco per esami e scenari. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Ripiego per browser molto vecchi o contesti non sicuri (http)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
