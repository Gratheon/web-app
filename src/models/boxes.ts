import { db } from './db'
import { Frame } from './frames.ts'

export type Box = {
	id: number
	type: string
	position: number
	color?: string
	holeCount?: number

	hiveId?: number //reference
	frames?: Frame[]
}

let boxes: Box[] = [] // db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
	ROOF: 'ROOF',
	LARGE_HORIZONTAL_SECTION: 'LARGE_HORIZONTAL_SECTION',
	GATE: 'GATE',
	VENTILATION: 'VENTILATION',
	QUEEN_EXCLUDER: 'QUEEN_EXCLUDER',
	HORIZONTAL_FEEDER: 'HORIZONTAL_FEEDER',
	BOTTOM: 'BOTTOM',
}

export const GATE_HOLE_COUNT_MIN = 0
export const GATE_HOLE_COUNT_MAX = 16
export const GATE_HOLE_COUNT_DEFAULT = 8

export function normalizeGateHoleCount(value: unknown): number {
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) {
		return GATE_HOLE_COUNT_DEFAULT
	}
	const rounded = Math.round(parsed)
	return Math.max(GATE_HOLE_COUNT_MIN, Math.min(GATE_HOLE_COUNT_MAX, rounded))
}

const TABLE_NAME = 'box'

export async function getBox(id: number): Promise<Box | undefined> {
	// Validate ID before querying
	if (!id || !Number.isFinite(id) || id <= 0) {
		console.warn(`Attempted to get box with invalid ID: ${id}`);
		return undefined; // Return undefined for invalid IDs
	}

	try {
		// Ensure ID passed to Dexie is a number. Assuming get expects the primary key directly.
		return await db[TABLE_NAME].get(+id);
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

export async function getBoxes(where: { hiveId?: number } = {}): Promise<Box[]> {
	// Validate hiveId if provided
	if (where.hasOwnProperty('hiveId')) {
		const hiveId = where.hiveId;
		if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
			console.warn(`Attempted to get boxes with invalid hiveId: ${hiveId}`);
			return []; // Return empty array for invalid hiveId
		}
		// Ensure the hiveId used in the query is a number
		where.hiveId = +hiveId;
	}

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
	holeCount,
}: Box) {
	try {
		const normalizedHoleCount =
			type === boxTypes.GATE ? normalizeGateHoleCount(holeCount) : undefined
		await db[TABLE_NAME].put({
			id,
			hiveId,
			position,
			type,
			holeCount: normalizedHoleCount,
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
	holeCount,
}: Box) {
	try {
		const normalizedHoleCount =
			type === boxTypes.GATE ? normalizeGateHoleCount(holeCount) : undefined
		await db[TABLE_NAME].put({
			id,
			hiveId,
			color,
			position,
			type,
			holeCount: normalizedHoleCount,
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
