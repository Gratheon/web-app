import { db } from './db'

export type Hive = {
	id: number
	name?: string
	notes?: string
	familyId?: number
	beeCount?: number
	inspectionCount?: number
	status?: string
}

const TABLE_NAME = 'hive'

export async function getHive(id: number): Promise<Hive | undefined> {
	// Validate ID before querying
	if (!id || !Number.isFinite(id) || id <= 0) {
		console.warn(`Attempted to get hive with invalid ID: ${id}`);
		return undefined; // Return undefined for invalid IDs
	}

	try {
		// Ensure ID passed to Dexie is a number
		return await db[TABLE_NAME].get(+id);
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateHive(data: Hive) {
	try {
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
