type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

let state: State = 'CLOSED'
let nextTry = 0
let failures = 0

export function canCall(): boolean {
  const now = Date.now()
  return state !== 'OPEN' || now >= nextTry
}

export function onSuccess(): void {
  state = 'CLOSED'
  failures = 0
  nextTry = 0
}

export function onFailure(): void {
  failures += 1
  const backoff = state === 'OPEN' ? Math.min(5 * 60 * 1000, 30000 * failures) : 10000
  state = 'OPEN'
  nextTry = Date.now() + backoff
}

export function status(): { state: State; nextTry: number; failures: number } {
  return { state, nextTry, failures }
}
