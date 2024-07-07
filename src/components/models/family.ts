import { db } from './db'

export type Family = {
	hiveId?: number //reference
	id: number
	race: string
	added: string
	age?: number // in years
  }
  
export async function getFamilyByHive(hiveId: number): Promise<Family> {
	try {
		return await db['family'].get({ hiveId })
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateFamily(data: Family) {
	try {
		return await db['family'].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
