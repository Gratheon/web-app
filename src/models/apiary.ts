import { db } from './db'

export type Apiary = {
	id: number
	name?: string
	lat?: string
	lng?: string
}

const TABLE_NAME = 'apiary'

export async function getApiaries(): Promise<Apiary[]> {
	try {
		return await db[TABLE_NAME].toArray();
	} catch (e) {
		console.error("failed to read apiaries", e);
		return [];
	}
}

export async function getApiary(id: number): Promise<Apiary | undefined> {
	// Validate ID before querying
	if (!id || !Number.isFinite(id) || id <= 0) {
		console.warn(`Attempted to get apiary with invalid ID: ${id}`);
		return undefined; // Return undefined for invalid IDs
	}

	try {
		// Ensure ID passed to Dexie is a number
		return await db[TABLE_NAME].get(+id);
	} catch (e) {
		console.error("failed to read apiary", e)
		throw e
	}
}

export async function updateApiary({
	id,
	name,
	lat,
	lng
}: Apiary) {
	try {
		await db[TABLE_NAME].put({
			id,
			name,
			lat,
			lng
		})
	} catch (e) {
		console.error("failed to update apiary", e)
		throw e
	}
}
