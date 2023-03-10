import { Family } from '@/components/api/schema'

import { db } from './db'

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
