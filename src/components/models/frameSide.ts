import { db } from './db'
import { Frame, getFramesByHive } from './frames'

type FrameSide = {
	id: number
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