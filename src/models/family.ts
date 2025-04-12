import { db } from './db'

export type Family = {
	hiveId?: number //reference
	id: number
	race: string
	added: string
	age?: number // in years
  }

const TABLE_NAME = 'family'

export async function getFamilyByHive(hiveId: number): Promise<Family | undefined> {
	// Validate hiveId before querying
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
		console.warn(`Attempted to get family with invalid hiveId: ${hiveId}`);
		return undefined; // Return undefined for invalid hiveId
	}

	try {
		// Ensure hiveId passed to Dexie is a number
		return await db[TABLE_NAME].get({ hiveId: +hiveId });
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateFamily(data: Family) {
	try {
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
