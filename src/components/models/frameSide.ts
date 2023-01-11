import { db } from './db'
import { getFrame } from './frames'

type FrameSide = {
	id: number
	queenDetected?: boolean
	pollenPercent?: number
	honeyPercent?: number
	droneBroodPercent?: number
	cappedBroodPercent?: number
	broodPercent?: number
}
export async function getFrameSide({ frameId, frameSide }): Promise<FrameSide> {
	const frame = await getFrame(frameId)

	if (!frame) {
		return null
	}

	return await db['frameside'].get(
		frameSide === 'left' ? frame?.leftId : frame?.rightId
	)
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
		frameSide.droneBroodPercent +
		frameSide.honeyPercent +
		frameSide.pollenPercent

	if (total > 100) {
		frameSide.broodPercent = Math.round((100 * frameSide.broodPercent) / total)
		frameSide.cappedBroodPercent = Math.round(
			(100 * frameSide.cappedBroodPercent) / total
		)
		frameSide.droneBroodPercent = Math.round(
			(100 * frameSide.droneBroodPercent) / total
		)
		frameSide.honeyPercent = Math.round((100 * frameSide.honeyPercent) / total)
		frameSide.pollenPercent = Math.round(
			(100 * frameSide.pollenPercent) / total
		)
	}

	frameSide[key] = percent

	await db['frameside'].put(frameSide)
}
