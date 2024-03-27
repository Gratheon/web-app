import { Family } from '../api/schema'
import { Box } from './boxes'
import { db } from './db'
import { Frame } from './frames'
import { Hive } from './hive'

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

	stats: {
		broodPercent: number
		honeyPercent: number
		pollenPercent: number

		workerBeeCount: number
		queenCount: number
		varroaCount: number
	}
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
		return await db['inspection'].where({
			hiveId
		}).limit(100).toArray()
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
