import { db, upsertEntityWithNumericID } from './db'
import { FrameSideCells } from './frameSideCells.ts'
import { FrameSideFile } from './frameSideFile.ts'
import { Frame } from './frames.ts'

export type FrameSide = {
	id: number
	frameId?: number
	cells?: FrameSideCells
	frameSideFile?: FrameSideFile
	isQueenConfirmed?: boolean
}

const TABLE_NAME = 'frameside'

export async function upsertFrameSide(frameside: FrameSide): Promise<void> {
	await upsertEntityWithNumericID(TABLE_NAME, frameside)
}

export async function getFrameSide(frameSideId: number): Promise<FrameSide | undefined> {
	// Validate frameSideId before querying
	if (!frameSideId || !Number.isFinite(frameSideId) || frameSideId <= 0) {
		console.warn(`Attempted to get frameSide with invalid ID: ${frameSideId}`);
		return undefined; // Return undefined for invalid IDs
	}

	try {
		// Ensure ID passed to Dexie is a number
		return await db[TABLE_NAME].get(+frameSideId);
	} catch (e) {
		console.error(e)
		throw e
	}
}

export function collectFrameSideIDsFromFrames(frames: Frame[]): number[] {
	let frameSideIds = []
	for (let frame of frames) {
		if (frame.leftId) {
			frameSideIds.push(frame.leftId)
		}
		if (frame.rightId) {
			frameSideIds.push(frame.rightId)
		}
	}

	return frameSideIds
}

export async function getFrameSidesMap(
	frameSideIds: number[]
): Promise<Map<number, FrameSide>> {
	const frameSides = await db[TABLE_NAME].where('id')
		.anyOf(frameSideIds)
		.toArray()

	// map frame sides to frames
	const frameSidesMap = new Map<number, FrameSide>()
	frameSides.forEach((frameSide) => {
		frameSidesMap.set(frameSide.id, frameSide)
	})

	return frameSidesMap
}

export async function enrichFramesWithSides(
	frames: Frame[]
): Promise<Frame[] | null> {
	try {
		const frameSideIds = collectFrameSideIDsFromFrames(frames)
		const frameSidesMap = await getFrameSidesMap(frameSideIds)

		// assign frame sides to frames
		frames.forEach((frame) => {
			if (frame.leftId && !frame.leftSide) {
				frame.leftSide = frameSidesMap.get(frame.leftId)
			}
			if (frame.rightId && !frame.rightSide) {
				frame.rightSide = frameSidesMap.get(frame.rightId)
			}
		})

		return frames
	} catch (e) {
		console.error(e)
		return null
	}
}
