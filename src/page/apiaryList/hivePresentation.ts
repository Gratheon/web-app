type FamilyLike = {
	id?: string | number | null
	name?: string | null
	race?: string | null
	added?: string | null
	lastTreatment?: string | null
}

type HiveLike = {
	status?: string | null
	family?: FamilyLike | null
	families?: FamilyLike[] | null
}

function normalizeYear(value?: string | null): number | null {
	if (!value) return null
	const parsed = Number.parseInt(String(value), 10)
	return Number.isFinite(parsed) ? parsed : null
}

export function getHiveFamilies(hive: HiveLike): FamilyLike[] {
	const fromFamilies = Array.isArray(hive?.families)
		? hive.families.filter(Boolean)
		: []
	const fallbackFamily = hive?.family ? [hive.family] : []
	const families = fromFamilies.length > 0 ? fromFamilies : fallbackFamily

	return [...families].sort((a, b) => {
		const yearA = normalizeYear(a?.added)
		const yearB = normalizeYear(b?.added)

		if (yearA !== null && yearB !== null && yearA !== yearB) {
			return yearA - yearB
		}
		if (yearA !== null && yearB === null) {
			return -1
		}
		if (yearA === null && yearB !== null) {
			return 1
		}

		const nameCompare = String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
			sensitivity: 'base',
		})
		if (nameCompare !== 0) {
			return nameCompare
		}

		return String(a?.id || '').localeCompare(String(b?.id || ''), undefined, { sensitivity: 'base' })
	})
}

export function getHiveQueenCount(hive: HiveLike): number {
	return getHiveFamilies(hive).length
}

export function getPrimaryFamilyForSort(hive: HiveLike): FamilyLike | null {
	const families = getHiveFamilies(hive)
	return families[0] || null
}

export function getColonyStatusLabel(hive: HiveLike): string {
	const status = String(hive?.status || '')
	if (getHiveQueenCount(hive) > 1) {
		return 'multi-queen'
	}
	return status
}
