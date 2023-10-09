import { db } from './db'
import { getFrame } from './frames'

type FrameSide = {
	id: number
	queenDetected?: boolean
	pollenPercent?: number
	honeyPercent?: number
	eggsPercent?: number
	cappedBroodPercent?: number
	broodPercent?: number
}
export async function getFrameSide(frameSideId: number): Promise<FrameSide> {
	return await db['frameside'].get(frameSideId)
}

export async function toggleQueen(frameSide: FrameSide): Promise<FrameSide> {
	frameSide.queenDetected = !frameSide.queenDetected;

	await db['frameside'].put(frameSide)

	return frameSide
}

export async function updateFrameStat(
	frameSide: FrameSide,
	key: string,
	percent: number
) {
	frameSide[key] = percent

	let total =
		frameSide.broodPercent +
		frameSide.cappedBroodPercent +
		frameSide.eggsPercent +
		frameSide.honeyPercent +
		frameSide.pollenPercent

	if (total > 100) {
		frameSide.broodPercent = Math.round((100 * frameSide.broodPercent) / total)
		frameSide.cappedBroodPercent = Math.round(
			(100 * frameSide.cappedBroodPercent) / total
		)
		frameSide.eggsPercent = Math.round(
			(100 * frameSide.eggsPercent) / total
		)
		frameSide.honeyPercent = Math.round((100 * frameSide.honeyPercent) / total)
		frameSide.pollenPercent = Math.round(
			(100 * frameSide.pollenPercent) / total
		)
	}

	frameSide[key] = percent

	try {
		await db['frameside'].put(frameSide)
	} catch (e) {
		console.error(e)
		throw e
	}

	return frameSide;
}
