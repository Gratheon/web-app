import find from 'lodash/find'
import isNil from 'lodash/isNil'
import filter from 'lodash/filter'
import remove from 'lodash/remove'
import orderBy from 'lodash/orderBy'
import map from 'lodash/map'
import db from './db'
import { Frame } from '../schema'

let frames = db.get('frames')
export const frameTypes = {
	VOID: 'VOID',
	FOUNDATION: 'FOUNDATION',
	EMPTY_COMB: 'EMPTY_COMB',
	FEEDER: 'FEEDER',
	PARTITION: 'PARTITION',
}

export function getFrames(where = {}): Frame[] {
	return orderBy(filter(frames, where), ['position'], ['asc'])
}

export function setFrames(data, where) {
	remove(frames, where)

	if (data) {
		data.forEach((row) => {
			frames.push({ ...row, ...where })
		})
	}

	db.set('frames', frames)
}

export function removeAllFromBox({
	hiveId,
	boxIndex,
}: {
	hiveId: string
	boxIndex: number
}) {
	remove(frames, { hiveId, boxIndex })
	db.set('frames', frames)
}

export function swapBox({
	hiveId,
	boxIndex,
	toBoxIndex,
}: {
	hiveId: string
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
	hiveId: string
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
	hiveId: string
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
	hiveId: string
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
	hiveId: string
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

export function removeFrame({ hiveId, boxIndex, framePosition }: { hiveId:string, boxIndex:number, framePosition:number }) {
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
