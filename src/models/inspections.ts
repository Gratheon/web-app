import { Family } from './family.ts'
import { Box } from './boxes.ts'
import { db } from './db'
import { HiveInspectionCellStats } from './frameSideCells.ts'
import { Frame } from './frames.ts'
import { Hive } from './hive.ts'

export type Inspection = {
	id: number
	hiveId: number
	data: string
	added: string
}

export type InspectionSnapshot = {
	hive: Hive
	family: Family
	frames: Frame[]
	boxes: Box[]

	cellStats: HiveInspectionCellStats
}

const TABLE_NAME = 'inspection'

export async function getInspection(id: number): Promise<Inspection> {
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
export async function listInspections(hiveId: number): Promise<Inspection> {
	if(!hiveId) {
		console.error('attempt to get inspections with invalid hiveId', {hiveId})
		return null;
	}

	try {
		return await db[TABLE_NAME]
			.where({ hiveId })
			.reverse()
			.limit(100)
			.toArray()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateInspection(data: Inspection) {
	try {
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
