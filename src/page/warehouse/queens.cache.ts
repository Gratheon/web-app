import { db } from '@/models/db'
import type { Family } from '@/models/family'
import type { Hive } from '@/models/hive'

export type CachedQueenListData = {
	assignedFamilies: Family[]
	unassignedFamilies: Family[]
	allFamilies: Family[]
	hives: Hive[]
}

let lastCachedQueenListData: CachedQueenListData | null = null

export function getCachedQueenListSnapshot(): CachedQueenListData | null {
	return lastCachedQueenListData
}

async function readCachedRows<T>(tableName: string): Promise<T[]> {
	const table = db[tableName]
	if (!table || typeof table.toArray !== 'function') {
		return []
	}

	return await table.toArray()
}

function hasAssignedHive(family: Family): boolean {
	const hiveId = Number((family as any)?.hiveId ?? (family as any)?.hive_id)
	return Number.isFinite(hiveId) && hiveId > 0
}

export async function getCachedQueenListData(): Promise<CachedQueenListData> {
	try {
		const [families, hives] = await Promise.all([
			readCachedRows<Family>('family'),
			readCachedRows<Hive>('hive'),
		])

		const data = {
			assignedFamilies: families.filter(hasAssignedHive),
			unassignedFamilies: families.filter((family) => !hasAssignedHive(family)),
			allFamilies: families,
			hives,
		}

		lastCachedQueenListData = data
		return data
	} catch (e) {
		console.error('Failed to read cached queen list from IndexedDB', e)
		return {
			assignedFamilies: [],
			unassignedFamilies: [],
			allFamilies: [],
			hives: [],
		}
	}
}
