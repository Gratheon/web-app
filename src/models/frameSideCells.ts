import { db } from './db';
import { Frame } from './frames.ts';
import colors from '@/colors'; // Import colors

export type FrameSideCells = {
	id: number // same as frameSideId, just for indexing
	frameSideId?: any // internal
	hiveId?: any // internal

	broodPercent?: number
	honeyPercent?: number
	pollenPercent?: number

	eggsPercent?: number
	cappedBroodPercent?: number
	droneBroodPercent?: number // Added drone brood
}

export type HiveInspectionCellStats = {
	broodPercent?: number
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
		broodPercent: 0,
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
		if (!res.droneBroodPercent){
			res.droneBroodPercent = 0
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
		cells.broodPercent +
		cells.cappedBroodPercent +
		cells.eggsPercent +
		cells.honeyPercent +
		cells.pollenPercent +
		cells.droneBroodPercent // Added drone brood

	if (total > 100) {
		cells.broodPercent = Math.floor((100 * cells.broodPercent) / total)
		cells.cappedBroodPercent = Math.floor(
			(100 * cells.cappedBroodPercent) / total
		)
		cells.eggsPercent = Math.floor((100 * cells.eggsPercent) / total)
		cells.honeyPercent = Math.floor((100 * cells.honeyPercent) / total)
		cells.pollenPercent = Math.floor((100 * cells.pollenPercent) / total)
		cells.droneBroodPercent = Math.floor((100 * cells.droneBroodPercent) / total) // Added drone brood
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
			stats.honeyPercent += left.honeyPercent
			stats.pollenPercent += left.pollenPercent
			stats.eggsPercent += left.eggsPercent
			stats.cappedBroodPercent += left.cappedBroodPercent
			stats.droneBroodPercent += left.droneBroodPercent // Added drone brood

			frameCount++
		}

		if (right) {
			stats.broodPercent += right.broodPercent
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
		honeyPercent: colors.honeyColor,
		pollenPercent: colors.pollenColor,
		eggsPercent: colors.eggsColor,
		cappedBroodPercent: colors.cappedBroodColor,
		droneBroodPercent: colors.drone, // Added drone brood (using existing drone color)
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
