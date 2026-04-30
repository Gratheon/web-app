export function isIndexedDbQuotaError(error: unknown): boolean {
	const seen = new Set<unknown>()
	const queue: unknown[] = [error]

	while (queue.length > 0) {
		const current = queue.shift()
		if (!current || seen.has(current)) continue
		seen.add(current)

		if (current instanceof Error) {
			if (current.name === 'QuotaExceededError') return true
			if (
				current.name === 'AbortError' &&
				current.message.includes('QuotaExceededError')
			) {
				return true
			}
			queue.push((current as any).inner, (current as any).cause)
			continue
		}

		if (typeof current === 'object') {
			const maybeError = current as {
				name?: unknown
				message?: unknown
				inner?: unknown
				cause?: unknown
				error?: unknown
			}
			if (maybeError.name === 'QuotaExceededError') return true
			if (
				maybeError.name === 'AbortError' &&
				String(maybeError.message || '').includes('QuotaExceededError')
			) {
				return true
			}
			queue.push(maybeError.inner, maybeError.cause, maybeError.error)
		}
	}

	return false
}
