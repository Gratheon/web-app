import { db } from './db'

type Inspection = {
	id: number
	hiveId: number
	added: string
}

export async function getInspection(id: number): Promise<Inspection> {
	if(!id) {
		console.error('attempt to get hive with invalid id', {id})
		return null;
	}

	try {
		return await db['inspection'].get(id)
	} catch (e) {
		console.error(e)
		throw e
	}
}
export async function listInspections(hiveId: number): Promise<Inspection> {
	if(!hiveId) {
		console.error('attempt to get inspections with invalid hiveId', {hiveId})
		return null;
	}

	try {
		return await db['inspection'].get({
			hiveId
		})
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateInspection(data: Inspection) {
	try {
		return await db['inspection'].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
