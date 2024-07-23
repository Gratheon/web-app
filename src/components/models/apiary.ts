import { db } from './db'

type Apiary = {
	id: number
	name?: string
	lat?: string
	lng?: string
}

const TABLE_NAME = 'apiary'

export async function getApiary(id: number): Promise<Apiary> {
	if(!id) {
		console.error('attempt to get apiary with invalid id', {id})
		return null;
	}

	try {
		return await db[TABLE_NAME].get(id)
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