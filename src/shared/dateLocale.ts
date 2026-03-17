const LOCALE_STORAGE_KEY = 'gratheon.user.locale'

export function getBrowserLocale(): string {
	if (typeof navigator !== 'undefined' && navigator.language) {
		return navigator.language
	}

	return 'en-US'
}

export function getStoredLocale(): string | null {
	if (typeof window === 'undefined') return null
	return window.localStorage.getItem(LOCALE_STORAGE_KEY)
}

export function persistLocale(locale?: string | null) {
	if (typeof window === 'undefined') return
	if (!locale) return
	window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function resolveLocale(
	locale?: string | null,
	lang?: string | null
): string {
	if (locale) return locale

	const stored = getStoredLocale()
	if (stored) return stored

	if (lang) return lang

	return getBrowserLocale()
}

export function formatDateTimeByLocale(
	value: string | number | Date,
	options: Intl.DateTimeFormatOptions = {},
	locale?: string | null
): string {
	const date = value instanceof Date ? value : new Date(value)
	const resolvedLocale = resolveLocale(locale)

	try {
		return new Intl.DateTimeFormat(resolvedLocale, options).format(date)
	} catch {
		return new Intl.DateTimeFormat('en-US', options).format(date)
	}
}
