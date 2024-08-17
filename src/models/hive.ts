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

export async function getHive(id: number): Promise<Hive> {
	if(!id) {
		console.error('attempt to get hive with invalid id', {id})
		return null;
	}

	try {
		return await db[TABLE_NAME].get(id)
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
