import { db } from './db'

export type FrameSideCells = {
	id: number // same as frameSideId, just for indexing
	frameSideId?: any // internal
	hiveId?: any // internal

	pollenPercent?: number
	honeyPercent?: number
	eggsPercent?: number
	cappedBroodPercent?: number
	broodPercent?: number
}

export async function getFrameSideCells(frameSideId: number): Promise<FrameSideCells> {
	try {
		return await db['framesidecells'].get(+frameSideId)
	} catch (e) {
		console.error(e)
		throw e
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
