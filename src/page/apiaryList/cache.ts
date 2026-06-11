import { db } from '@/models/db'

export type CachedApiaryListData = {
	apiaries: any[]
	boxSystems: any[]
}

let lastCachedApiaryListData: CachedApiaryListData | null = null

export function getCachedApiaryListSnapshot(): CachedApiaryListData | null {
	return lastCachedApiaryListData
}

async function readCachedRows(tableName: string): Promise<any[]> {
	const table = db[tableName]
	if (!table || typeof table.toArray !== 'function') {
		return []
	}

	return await table.toArray()
}

function relationId(value: any): string | null {
	if (value === null || value === undefined) {
		return null
	}

	return String(value)
}

function groupByRelation(
	rows: any[],
	getKey: (row: any) => string | null
): Map<string, any[]> {
	const grouped = new Map<string, any[]>()
	for (const row of rows || []) {
		const key = getKey(row)
		if (!key) {
			continue
		}

		grouped.set(key, [...(grouped.get(key) || []), row])
	}

	return grouped
}

export async function getCachedApiaryListData(): Promise<CachedApiaryListData> {
	try {
		const [apiaries, hives, boxes, families, boxSystems] = await Promise.all([
			readCachedRows('apiary'),
			readCachedRows('hive'),
			readCachedRows('box'),
			readCachedRows('family'),
			readCachedRows('boxsystem'),
		])

		const hasApiaryRelations = hives.some(
			(hive) => hive?.apiaryId != null || hive?.apiary_id != null
		)
		const boxesByHiveId = groupByRelation(boxes, (box) =>
			relationId(box?.hiveId ?? box?.hive_id)
		)
		const familiesByHiveId = groupByRelation(families, (family) =>
			relationId(family?.hiveId ?? family?.hive_id)
		)

		// WHY: GraphQL responses are cached in normalized Dexie tables. The apiary
		// listing needs the nested shape, so rebuild it locally and let the network
		// query refresh those same tables in the background.
		const data = {
			apiaries: apiaries
				.filter((apiary) => apiary?.id != null)
				.map((apiary) => {
					const apiaryId = relationId(apiary.id)
					const apiaryHives = hives
						.filter((hive) => {
							if (!hasApiaryRelations && apiaries.length === 1) {
								return true
							}

							return relationId(hive?.apiaryId ?? hive?.apiary_id) === apiaryId
						})
						.map((hive) => {
							const hiveId = relationId(hive?.id)
							const hiveFamilies = hiveId
								? familiesByHiveId.get(hiveId) || []
								: []
							const hiveBoxes = hiveId
								? [...(boxesByHiveId.get(hiveId) || [])]
								: []
							hiveBoxes.sort(
								(a, b) => Number(a?.position || 0) - Number(b?.position || 0)
							)

							return {
								...hive,
								family: hiveFamilies[0] || null,
								families: hiveFamilies,
								boxes: hiveBoxes,
							}
						})

					return {
						...apiary,
						hives: apiaryHives,
					}
				}),
			boxSystems,
		}
		lastCachedApiaryListData = data
		return data
	} catch (e) {
		console.error('Failed to read cached apiary list from IndexedDB', e)
		return { apiaries: [], boxSystems: [] }
	}
}
