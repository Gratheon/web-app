import { db } from './db'

type Apiary = {
	id: number
	name?: string
}

export async function getApiary(id: number): Promise<Apiary> {
	if(!id) {
		console.error('attempt to get apiary with invalid id', {id})
		return null;
	}

	try {
		return await db['apiary'].get(id)
	} catch (e) {
		console.error(e)
		throw e
	}
}