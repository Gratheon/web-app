import { db } from './db';
import { Frame } from './frames.ts';
import colors from '@/colors'; // Import colors

export type FrameSideCells = {
	id: number // same as frameSideId, just for indexing
	frameSideId?: any // internal
	hiveId?: any // internal
	cells?: any[]

	broodPercent?: number
	nectarPercent?: number
	honeyPercent?: number
	pollenPercent?: number

	eggsPercent?: number
	cappedBroodPercent?: number
	droneBroodPercent?: number // Added drone brood
}

export type HiveInspectionCellStats = {
	broodPercent?: number
	nectarPercent?: number
	honeyPercent?: number
	pollenPercent?: number

	eggsPercent?: number
	cappedBroodPercent?: number
	droneBroodPercent?: number // Added drone brood
}

export const FRAME_SIDE_CELL_TABLE = 'files_frame_side_cells'

export function newFrameSideCells(id, hiveId): FrameSideCells {
	return {
		id,
		frameSideId: id,
		hiveId,
		cells: [],
		broodPercent: 0,
		nectarPercent: 0,
		honeyPercent: 0,
		pollenPercent: 0,
		eggsPercent: 0,
		cappedBroodPercent: 0,
		droneBroodPercent: 0, // Added drone brood
	}
}

export async function getFrameSideCells(
	frameSideId: number
): Promise<FrameSideCells | null> {
	try {
		let res = await db[FRAME_SIDE_CELL_TABLE].get(+frameSideId)
		if (!res) return null
		if (!res.droneBroodPercent){
			res.droneBroodPercent = 0
		}
		if (!res.nectarPercent){
			res.nectarPercent = 0
		}
		return res
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
		(cells.broodPercent || 0) +
		(cells.cappedBroodPercent || 0) +
		(cells.eggsPercent || 0) +
		(cells.nectarPercent || 0) +
		(cells.honeyPercent || 0) +
		(cells.pollenPercent || 0) +
		(cells.droneBroodPercent || 0) // Added drone brood

	if (total > 100) {
		cells.broodPercent = Math.floor((100 * (cells.broodPercent || 0)) / total)
		cells.cappedBroodPercent = Math.floor(
			(100 * (cells.cappedBroodPercent || 0)) / total
		)
		cells.eggsPercent = Math.floor((100 * (cells.eggsPercent || 0)) / total)
		cells.nectarPercent = Math.floor((100 * (cells.nectarPercent || 0)) / total)
		cells.honeyPercent = Math.floor((100 * (cells.honeyPercent || 0)) / total)
		cells.pollenPercent = Math.floor((100 * (cells.pollenPercent || 0)) / total)
		cells.droneBroodPercent = Math.floor((100 * (cells.droneBroodPercent || 0)) / total) // Added drone brood
	}

	try {
		await db[FRAME_SIDE_CELL_TABLE].put(cells)
	} catch (e) {
		console.error(e)
		throw e
	}

	return cells
}

export async function updateFrameSideCells(cells: FrameSideCells) {
	try {
		await db[FRAME_SIDE_CELL_TABLE].put(cells)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getHiveInspectionStats(
	frames: Frame[]
): Promise<HiveInspectionCellStats> {
	let stats: HiveInspectionCellStats = {
		broodPercent: 0,
		nectarPercent: 0,
		honeyPercent: 0,
		pollenPercent: 0,
		eggsPercent: 0,
		cappedBroodPercent: 0,
		droneBroodPercent: 0, // Added drone brood
	}
	let frameCount = 0

	for (let frame of frames) {
		let [left, right] = await Promise.all([
			getFrameSideCells(+frame.leftId),
			getFrameSideCells(+frame.rightId),
		])

		if (left) {
			stats.broodPercent += left.broodPercent
			stats.nectarPercent += left.nectarPercent
			stats.honeyPercent += left.honeyPercent
			stats.pollenPercent += left.pollenPercent
			stats.eggsPercent += left.eggsPercent
			stats.cappedBroodPercent += left.cappedBroodPercent
			stats.droneBroodPercent += left.droneBroodPercent // Added drone brood

			frameCount++
		}

		if (right) {
			stats.broodPercent += right.broodPercent
			stats.nectarPercent += right.nectarPercent
			stats.honeyPercent += right.honeyPercent
			stats.pollenPercent += right.pollenPercent
			stats.eggsPercent += right.eggsPercent
			stats.cappedBroodPercent += right.cappedBroodPercent
			stats.droneBroodPercent += right.droneBroodPercent // Added drone brood
			frameCount++
		}
	}

	// average collected percentages
	stats.broodPercent /= frameCount
	stats.nectarPercent /= frameCount
	stats.honeyPercent /= frameCount
	stats.pollenPercent /= frameCount
	stats.eggsPercent /= frameCount
	stats.cappedBroodPercent /= frameCount
	stats.droneBroodPercent /= frameCount // Added drone brood

	return stats
}

export async function deleteCellsByFrameSideIDs(frameSideIds: number[]) {
	try {
		await db[FRAME_SIDE_CELL_TABLE].where('frameSideId')
			.anyOf(frameSideIds)
			.delete()
	} catch (e) {
		console.error(e)
		throw e
	}
}

// New function to get dominant color
export async function getDominantResourceColorForFrameSide(
	frameSideId: number
): Promise<string | null> {
	const cells = await getFrameSideCells(frameSideId);
	if (!cells) {
		return null; // No cell data found
	}

	let dominantResource = '';
	let maxPercent = -1; // Start below 0

	// Define resource types and their corresponding colors
	const resourceTypes = {
		broodPercent: colors.broodColor,
		nectarPercent: colors.nectarColor,
		honeyPercent: colors.honeyColor,
		pollenPercent: colors.pollenColor,
		eggsPercent: colors.eggsColor,
		cappedBroodPercent: colors.cappedBroodColor,
		droneBroodPercent: colors.droneBroodColor,
	};

	// Iterate through resource types to find the dominant one
	for (const resourceKey in resourceTypes) {
		const percent = cells[resourceKey] ?? 0; // Default to 0 if undefined
		if (percent > maxPercent) {
			maxPercent = percent;
			dominantResource = resourceKey;
		}
	}

	// Return the color if a dominant resource was found (maxPercent > 0)
	if (dominantResource && maxPercent > 0) {
		return resourceTypes[dominantResource];
	}

	return null; // Return null if no resource has > 0%
}


export async function enrichFramesWithSideCells(
	frames: Frame[]
): Promise<Frame[] | null> {
	try {
		const frameSideIds: number[] = []
		for (let frame of frames) {
			if (frame.leftId) {
				frameSideIds.push(frame.leftId)
			}
			if (frame.rightId) {
				frameSideIds.push(frame.rightId)
			}
		}
		if (frameSideIds.length === 0) {
			return frames
		}

		const frameSideCells = await db[FRAME_SIDE_CELL_TABLE].where('frameSideId')
			.anyOf(frameSideIds)
			.toArray()

		const frameSideCellsMap = new Map<number, FrameSideCells>()
		frameSideCells.forEach((frameSideCell) => {
			frameSideCellsMap.set(frameSideCell.frameSideId, frameSideCell)
		})

		frames.forEach((frame, index, array) => {
			if (frame.leftSide) {
				frame.leftSide.cells = frameSideCellsMap.get(+frame.leftId)
			} else {
				console.warn('frame.leftSide is null', frame)
			}

			if (frame.rightSide) {
				frame.rightSide.cells = frameSideCellsMap.get(+frame.rightId)
			} else {
				console.warn('frame.rightSide is null', frame)
			}

			array[index] = frame
		})

		return frames
	} catch (e) {
		console.error(e)
		return null
	}
}
