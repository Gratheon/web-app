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
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
		console.warn(`Attempted to get family with invalid hiveId: ${hiveId}`);
		return undefined;
	}

	try {
		return await db[TABLE_NAME].get({ hiveId: +hiveId });
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getAllFamiliesByHive(hiveId: number): Promise<Family[]> {
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
		console.warn(`Attempted to get families with invalid hiveId: ${hiveId}`);
		return [];
	}

	try {
		return await db[TABLE_NAME].where({ hiveId: +hiveId }).toArray();
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

export async function deleteFamily(familyId: number) {
	try {
		return await db[TABLE_NAME].delete(familyId)
	} catch (e) {
		console.error(e)
		throw e
	}
}

