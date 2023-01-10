import { db } from './db'

type Hive = {
	id: number
	name?: string
	notes?: string
	boxCount: number
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

export async function updateHive(id: number, delta: object) {
	try {
		console.log('updating hive', { id, delta })
		return await db['hive'].update(id, delta)
	} catch (e) {
		console.error(e)
		throw e
	}
}
