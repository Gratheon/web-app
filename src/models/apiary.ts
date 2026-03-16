import { db } from './db'

export type Apiary = {
	id: number
	name?: string
	type?: ApiaryType
	lat?: string
	lng?: string
	photoUrl?: string
	photoFileId?: number
}

export const apiaryTypes = {
	STATIC: 'STATIC',
	MOBILE: 'MOBILE',
} as const

export type ApiaryType = (typeof apiaryTypes)[keyof typeof apiaryTypes]

export function normalizeApiaryType(type?: string | null): ApiaryType {
	return type === apiaryTypes.MOBILE ? apiaryTypes.MOBILE : apiaryTypes.STATIC
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
	type,
	lat,
	lng,
	photoUrl,
	photoFileId
}: Apiary) {
	try {
		const existing = await db[TABLE_NAME].get(id)
		await db[TABLE_NAME].put({
			...existing,
			id,
			name,
			type: type ?? existing?.type ?? apiaryTypes.STATIC,
			lat,
			lng,
			photoUrl,
			photoFileId
		})
	} catch (e) {
		console.error("failed to update apiary", e)
		throw e
	}
}
