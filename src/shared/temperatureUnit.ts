export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'] as const

export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number]

export const DEFAULT_TEMPERATURE_UNIT: TemperatureUnit = 'celsius'

export function normalizeTemperatureUnit(unit?: string | null): TemperatureUnit | null {
	if (!unit) return null
	const normalized = unit.trim().toLowerCase()
	return normalized === 'fahrenheit' ? 'fahrenheit' : normalized === 'celsius' ? 'celsius' : null
}

export function localeUsesFahrenheit(locale?: string | null): boolean {
	if (!locale) return false
	const parts = locale.trim().replace('_', '-').split('-')
	return parts.some((part) => part.toUpperCase() === 'US')
}

export function getDefaultTemperatureUnitForLocale(locale?: string | null): TemperatureUnit {
	return localeUsesFahrenheit(locale) ? 'fahrenheit' : DEFAULT_TEMPERATURE_UNIT
}

export function getBrowserTemperatureUnit(): TemperatureUnit {
	if (typeof navigator === 'undefined') return DEFAULT_TEMPERATURE_UNIT
	return getDefaultTemperatureUnitForLocale(navigator.language)
}

export function getPreferredTemperatureUnit(user?: { temperatureUnit?: string | null; locale?: string | null } | null): TemperatureUnit {
	return normalizeTemperatureUnit(user?.temperatureUnit)
		|| getDefaultTemperatureUnitForLocale(user?.locale)
}

export function celsiusToFahrenheit(value: number): number {
	return value * 9 / 5 + 32
}

export function convertFromCelsius(value: number | null | undefined, unit: TemperatureUnit): number | null {
	if (value === null || value === undefined || Number.isNaN(value)) return null
	return unit === 'fahrenheit' ? celsiusToFahrenheit(value) : value
}

export function temperatureUnitSymbol(unit: TemperatureUnit): string {
	return unit === 'fahrenheit' ? '°F' : '°C'
}

export function formatTemperatureFromCelsius(
	value: number | null | undefined,
	unit: TemperatureUnit,
	fractionDigits = 1,
): string {
	const converted = convertFromCelsius(value, unit)
	if (converted === null) return '--'
	return `${converted.toFixed(fractionDigits)}${temperatureUnitSymbol(unit)}`
}

export function convertMetricSeriesFromCelsius<T extends { value: number | null }>(
	data: T[],
	unit: TemperatureUnit,
): T[] {
	if (unit === 'celsius') return data
	return data.map((item) => ({
		...item,
		value: convertFromCelsius(item.value, unit),
	}))
}
