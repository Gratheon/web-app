import { db } from './db'
import { Frame } from './frames'

export type FrameSideCells = {
	id: number // same as frameSideId, just for indexing
	frameSideId?: any // internal
	hiveId?: any // internal

	broodPercent?: number
	honeyPercent?: number
	pollenPercent?: number

	eggsPercent?: number
	cappedBroodPercent?: number
}

export type HiveInspectionCellStats = {
	broodPercent?: number
	honeyPercent?: number
	pollenPercent?: number

	eggsPercent?: number
	cappedBroodPercent?: number
}

// workerBeeCount: number
// queenCount: number
// varroaCount: number

export async function getFrameSideCells(frameSideId: number): Promise<FrameSideCells | null> {
	try {
		return await db['framesidecells'].get(+frameSideId)
	} catch (e) {
		console.error(e)
		return null
	}
}

export async function updateFrameStat(
	cells: FrameSideCells,
	key: string,
	percent: number
) {
	cells[key] = +percent

	let total =
		cells.broodPercent +
		cells.cappedBroodPercent +
		cells.eggsPercent +
		cells.honeyPercent +
		cells.pollenPercent

	if (total > 100) {
		cells.broodPercent = Math.floor(100 * cells.broodPercent / total)
		cells.cappedBroodPercent = Math.floor(100 * cells.cappedBroodPercent / total)
		cells.eggsPercent = Math.floor(100 * cells.eggsPercent / total)
		cells.honeyPercent = Math.floor(100 * cells.honeyPercent / total)
		cells.pollenPercent = Math.floor(100 * cells.pollenPercent / total)
	}

	try {
		await db['framesidecells'].put(cells)
	} catch (e) {
		console.error(e)
		throw e
	}

	return cells;
}

export async function getHiveInspectionStats(frames: Frame[]): Promise<HiveInspectionCellStats> {
	let stats: HiveInspectionCellStats = {
		broodPercent: 0,
		honeyPercent: 0,
		pollenPercent: 0,
		eggsPercent: 0,
		cappedBroodPercent: 0
	}
	let frameCount = 0

	for (let frame of frames) {
		let [left, right] = await Promise.all([
			getFrameSideCells(+frame.leftId),
			getFrameSideCells(+frame.rightId)
		])

		if (left) {
			stats.broodPercent += left.broodPercent
			stats.honeyPercent += left.honeyPercent
			stats.pollenPercent += left.pollenPercent
			stats.eggsPercent += left.eggsPercent
			stats.cappedBroodPercent += left.cappedBroodPercent

			frameCount++
		}

		if (right) {
			stats.broodPercent += right.broodPercent
			stats.honeyPercent += right.honeyPercent
			stats.pollenPercent += right.pollenPercent
			stats.eggsPercent += right.eggsPercent
			stats.cappedBroodPercent += right.cappedBroodPercent
			frameCount++
		}
	}

	// average collected percentages
	stats.broodPercent /= frameCount
	stats.honeyPercent /= frameCount
	stats.pollenPercent /= frameCount
	stats.eggsPercent /= frameCount
	stats.cappedBroodPercent /= frameCount

	return stats
}