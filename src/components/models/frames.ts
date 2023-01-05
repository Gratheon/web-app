import find from 'lodash/find'
import isNil from 'lodash/isNil'
import filter from 'lodash/filter'
import remove from 'lodash/remove'
import map from 'lodash/map'
import { Frame } from '../api/schema'

import { db } from './db'

let frames = [] //db.get('frames')
export const frameTypes = {
	VOID: 'VOID',
	FOUNDATION: 'FOUNDATION',
	EMPTY_COMB: 'EMPTY_COMB',
	FEEDER: 'FEEDER',
	PARTITION: 'PARTITION',
}

export async function getFrames(where = {}): Promise<Frame[]> {
	if (!where) return []
	try {
		const frames = await db['frame'].where(where).sortBy('position')

		for await (let frame of frames) {
			if (frame.leftId) {
				frame.leftSide = await db['frameside'].get(frame.leftId)
			}
			if (frame.rightId) {
				frame.rightSide = await db['frameside'].get(frame.rightId)
			}
		}
		return frames
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function countBoxFrames(boxId): Promise<number> {
	try {
		return await db['frame'].where({ boxId }).count()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export function setFrames(data, where) {
	remove(frames, where)

	if (data) {
		data.forEach((row) => {
			frames.push({ ...row, ...where })
		})
	}
}

export function removeAllFromBox({
	hiveId,
	boxIndex,
}: {
	hiveId: number
	boxIndex: number
}) {
	remove(frames, { hiveId, boxIndex })
}

export function swapBox({
	hiveId,
	boxIndex,
	toBoxIndex,
}: {
	hiveId: number
	boxIndex: number
	toBoxIndex: number
}) {
	let tmpFrames = filter(frames, { hiveId })
	tmpFrames.map((v) => {
		if (v.boxIndex === boxIndex) {
			v.boxIndex = toBoxIndex
		} else if (v.boxIndex === toBoxIndex) {
			v.boxIndex = boxIndex
		}
	})
	setFrames(tmpFrames, { hiveId })
}

export function moveFramesToBox({
	hiveId,
	boxIndex,
	toBoxIndex,
}: {
	hiveId: number
	boxIndex: number
	toBoxIndex: number
}) {
	let tmpFrames = filter(frames, { hiveId })
	tmpFrames.map((v) => {
		if (v.boxIndex === boxIndex) {
			v.boxIndex = toBoxIndex
		}
	})
	setFrames(tmpFrames, { hiveId })
}

export function addFrame({
	hiveId,
	boxIndex,
	frameType,
}: {
	hiveId: number
	boxIndex: number
	frameType: string
}) {
	let tmpFrames = filter(frames, { hiveId, boxIndex })

	const emptyFrame = {
		hiveId,
		boxIndex,
		type: frameType,
		leftSide: null,
		rightSide: null,
		position: isNil(tmpFrames) ? 0 : tmpFrames.length,
	}

	if (isFrameWithSides(frameType)) {
		const emptySide = () => ({
			broodPercent: 0,
			cappedBroodPercent: 0,
			droneBroodPercent: 0,
			honeyPercent: 0,
			pollenPercent: 0,
			queenDetected: false,
		})

		emptyFrame.leftSide = emptySide()
		emptyFrame.rightSide = emptySide()
	}

	tmpFrames.push(emptyFrame)

	setFrames(tmpFrames, { hiveId, boxIndex })
}

export function moveFrame({
	hiveId,
	removedIndex,
	addedIndex,
	boxIndex,
}: {
	hiveId: number
	removedIndex: number
	addedIndex: number
	boxIndex: number
}) {
	let tmpFrames = filter(frames, { hiveId, boxIndex })

	tmpFrames.map((v) => {
		if (v.position === removedIndex) {
			v.position = -1
		}
	})

	tmpFrames.map((v) => {
		if (v.position !== -1) {
			if (removedIndex > addedIndex) {
				if (v.position >= addedIndex) {
					v.position++
				}

				if (v.position > removedIndex + 1) {
					v.position--
				}
			} else {
				if (v.position >= removedIndex + 1) {
					v.position--
				}

				if (v.position >= addedIndex) {
					v.position++
				}
			}
		}
	})

	tmpFrames.map((v) => {
		if (v.position === -1) {
			v.position = addedIndex
		}
	})

	setFrames(tmpFrames, { hiveId, boxIndex })
}

export function setFrameSideProperty({
	hiveId,
	boxIndex,
	position,
	side,
	prop,
	value,
}: {
	hiveId: number
	boxIndex: number
	position: number
	side: string
	prop: string
	value: any
}) {
	const frame = find(frames, { hiveId, boxIndex, position })
	frame[side] = {
		...frame[side],
	}
	frame[side][prop] = value
}

export function removeFrame({
	hiveId,
	boxIndex,
	framePosition,
}: {
	hiveId: number
	boxIndex: number
	framePosition: number
}) {
	let tmpFrames = filter(frames, { hiveId, boxIndex })

	remove(tmpFrames, {
		hiveId,
		position: framePosition,
	})

	map(tmpFrames, (v) => {
		if (v.position > framePosition) {
			v.position--
		}
	})

	setFrames(tmpFrames, {
		hiveId,
		boxIndex,
	})
}

export function isFrameWithSides(frameType) {
	return (
		frameType === frameTypes.EMPTY_COMB ||
		frameType === frameTypes.FOUNDATION ||
		frameType === frameTypes.VOID
	)
}
