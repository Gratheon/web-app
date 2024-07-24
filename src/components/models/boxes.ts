import { db } from './db'
import { Frame } from './frames'

export type Box = {
	id: number
	type: string
	position: number
	color?: string

	hiveId?: number //reference
	frames?: Frame[]
}

let boxes: Box[] = [] // db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
	GATE: 'GATE',
	VENTILATION: 'VENTILATION',
	QUEEN_EXCLUDER: 'QUEEN_EXCLUDER',
	HORIZONTAL_FEEDER: 'HORIZONTAL_FEEDER',
}

const TABLE_NAME = 'box'

export async function getBox(id: number): Promise<Box> {
	if (!id) {
		return null
	}

	try {
		return await db[TABLE_NAME].get({ id })
	} catch (e) {
		console.error(e, { id })
	}
}

export async function getBoxAtPositionAbove(hiveId, position): Promise<Box> {
	try {
		const boxes = await db[TABLE_NAME]
			.where('hiveId')
			.equals(hiveId)
			.filter((row) => row.position > position)
			.sortBy('position')

		if (boxes.length > 0) return boxes[0]
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getBoxAtPositionBelow(hiveId, position): Promise<Box> {
	try {
		const boxes = await db[TABLE_NAME]
			.where('hiveId')
			.equals(hiveId)
			.filter((row) => row.position < position)
			.reverse()
			.sortBy('position')

		if (boxes.length > 0) return boxes[0]
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getBoxes(where = {}): Promise<Box[]> {
	try {
		return await db[TABLE_NAME]
		.where(where)
		.reverse()
		.sortBy('position')
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function maxBoxPosition(hiveId: number) {
	try {
		const box = await db[TABLE_NAME].orderBy('position').last()
		if (box) return box.position
		else return 0
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function removeBox(id: number) {
	try {
		return await db[TABLE_NAME].delete(id)
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
}: Box) {
	try {
		await db[TABLE_NAME].put({
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

export async function updateBox({
	id,
	hiveId,
	color,
	position,
	type,
}: Box) {
	try {
		await db[TABLE_NAME].put({
			id,
			hiveId,
			color,
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

	try {
		await db[TABLE_NAME].put(box1)
		await db[TABLE_NAME].put(box2)
	} catch (e) {
		console.error(e)
		throw e
	}

	return true
}
