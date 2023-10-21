import { db } from './db'

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
