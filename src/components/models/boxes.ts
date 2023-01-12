import { Box } from '@/components/api/schema'
import { db } from './db'

let boxes: Box[] = [] // db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
}

export async function getBox(id: number): Promise<Box> {
	if (!id) {
		return null
	}

	try {
		return await db['box'].get({ id })
	} catch (e) {
		console.error(e, { id })
	}
}

export async function getBoxAtPositionAbove(hiveId, position): Promise<Box> {
	try {
		const boxes = await db['box']
			.where('hiveId').equals(hiveId)
			.filter((row)=> row.position > position)
			.sortBy('position')

		if(boxes.length>0) return boxes[0];
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getBoxAtPositionBelow(hiveId, position): Promise<Box> {
	try {
		const boxes = await db['box']
			.where('hiveId').equals(hiveId)
			.filter((row) => row.position < position)
			.reverse()
			.sortBy('position')

		if(boxes.length>0) return boxes[0];
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getBoxes(where = {}): Promise<Box[]> {
	try {
		return await db['box'].where(where).reverse().sortBy('position')
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function countHiveBoxes(hiveId: number) {
	try {
		return await db['box']
			.where({
				hiveId,
			})
			.count()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function removeBox(id: number) {
	try {
		return await db['box'].delete(id)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function addBox({
	id,
	hiveId,
	position,
	type,
}: {
	id: number
	hiveId: number
	position: number
	type: string
}) {
	try {
		await db['box'].put({
			id,
			hiveId,
			position,
			type,
		})
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function swapBoxPositions(box1: Box, box2: Box) {
	const tmp = +`${box1.position}`

	box1.position = box2.position
	box2.position = tmp

	await db['box'].put(box1)
	await db['box'].put(box2)

	return true
}
