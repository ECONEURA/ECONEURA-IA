export async function backoff<T>(fn: () => Promise<T>, retries = 2, base = 400): Promise<T> {
  let lastError: any
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i === retries) break
      await new Promise(r => setTimeout(r, base * Math.pow(2, i)))
    }
  }
  throw lastError
}

