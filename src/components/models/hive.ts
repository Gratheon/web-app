import { db } from './db'

type Hive = {
	id: number
	name?: string
	notes?: string
	familyId?: number
}

export async function getHive(id: number): Promise<Hive> {
	if(!id) {
		console.error('attempt to get hive with invalid id', {id})
		return null;
	}

	try {
		return await db['hive'].get(id)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateHive(data: Hive) {
	try {
		return await db['hive'].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
