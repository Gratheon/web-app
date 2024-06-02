import { db, upsertEntityWithNumericID } from './db'
import { FrameSideCells } from './frameSideCells'
import { FrameSideFile } from './frameSideFile'
import { Frame } from './frames'

export type FrameSide = {
	id: number
	frameId?: number
	cells?: FrameSideCells
	frameSideFile?: FrameSideFile
}

export async function upsertFrameSide(frameside: FrameSide): Promise<void> {
	await upsertEntityWithNumericID('frameside', frameside)
}

export async function getFrameSide(frameSideId: number): Promise<FrameSide> {
	try {
		return await db['frameside'].get(+frameSideId)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export function getFrameSideIDsFrames(frames: Frame[]): number[] {
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