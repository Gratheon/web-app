import {
	getColonyStatusLabel,
	getHiveFamilies,
	getHiveQueenCount,
	getPrimaryFamilyForSort,
} from './hivePresentation'

type HiveLike = {
	id?: string | number | null
	hiveNumber?: number | null
	name?: string | null
	beeCount?: number | null
	status?: string | null
	lastInspection?: string | null
	isNew?: boolean
	boxes?: any[]
	family?: {
		id?: string | number | null
		name?: string | null
		lastTreatment?: string | null
		added?: string | null
		race?: string | null
	} | null
	families?: Array<{
		id?: string | number | null
		name?: string | null
		lastTreatment?: string | null
		added?: string | null
		race?: string | null
	}> | null
}

function getSortValue(hive: HiveLike, column: string) {
	const families = getHiveFamilies(hive)
	const primaryFamily = getPrimaryFamilyForSort(hive)

	switch (column) {
	case 'HIVE_NUMBER':
		return hive?.hiveNumber ?? null
	case 'QUEEN':
		return primaryFamily?.name || hive?.name || ''
	case 'BEE_COUNT':
		return hive?.beeCount ?? null
	case 'STATUS':
		return getColonyStatusLabel(hive)
	case 'LAST_TREATMENT':
		return families[0]?.lastTreatment ? new Date(families[0].lastTreatment).getTime() : null
	case 'LAST_INSPECTION':
		return hive?.lastInspection ? new Date(hive.lastInspection).getTime() : null
	case 'QUEEN_YEAR':
		return primaryFamily?.added ? Number.parseInt(primaryFamily.added, 10) : null
	case 'QUEEN_RACE':
		return primaryFamily?.race ?? ''
	default:
		return null
	}
}

export function sortHives<T extends HiveLike>(hives: T[] = [], sortBy: string, sortOrder: string): T[] {
	const sorted = [...hives]

	sorted.sort((hiveA, hiveB) => {
		const aValue = getSortValue(hiveA, sortBy)
		const bValue = getSortValue(hiveB, sortBy)
		const hasA = aValue !== null && aValue !== undefined && aValue !== ''
		const hasB = bValue !== null && bValue !== undefined && bValue !== ''

		if (!hasA && !hasB) {
			return 0
		}
		if (!hasA) {
			return 1
		}
		if (!hasB) {
			return -1
		}

		if (typeof aValue === 'number' && typeof bValue === 'number') {
			return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue
		}

		if (sortBy === 'QUEEN') {
			const queenCountA = getHiveQueenCount(hiveA)
			const queenCountB = getHiveQueenCount(hiveB)

			if (queenCountA !== queenCountB) {
				return queenCountB - queenCountA
			}
		}

		const compareValue = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
		return sortOrder === 'ASC' ? compareValue : -compareValue
	})

	return sorted
}
