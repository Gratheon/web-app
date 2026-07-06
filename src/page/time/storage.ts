export const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
	try {
		const stored = localStorage.getItem(key)
		return stored ? JSON.parse(stored) : defaultValue
	} catch {
		return defaultValue
	}
}

export const saveToLocalStorage = <T,>(key: string, value: T): void => {
	try {
		localStorage.setItem(key, JSON.stringify(value))
	} catch (e) {
		console.error('Failed to save to localStorage:', e)
	}
}
