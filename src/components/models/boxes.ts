import find from 'lodash/find'
import remove from 'lodash/remove'
import map from 'lodash/map'

import { db } from './db';

import { Box } from '../api/schema'

let boxes: Box[] = [] // db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
}

export async function getBoxes(where = {}): Promise<Box[]> {
	return await db['box'].where(where).sortBy('position')
}

export async function countHiveBoxes(hiveId: number){
	return await db['box'].where({
		hiveId
	}).count()
}


export function setBoxes(data: any[], where: any | null = null) {
	remove(boxes, where)
	data.forEach((row: any) => {
		boxes.push({ ...row, ...where })
	})
}

export async function addBox({
	id,	hiveId, position, type
}: {
	id: number,
	hiveId: number
	position: number
	type: string
}) {
	await db['box'].put({
		id,	hiveId, position, type
	})

	// @ts-ignore
	// boxes.push({
	// 	position: tmpBoxes.length,
	// 	hiveId,
	// 	type: boxType,
	// })
	//db.set('boxes', boxes)
}

export function removeBox({
	hiveId,
	position,
}: {
	hiveId: number
	position: number
}) {
	const tmpBoxes = getBoxes({
		hiveId,
	})

	remove(tmpBoxes, {
		hiveId,
		position,
	})

	map(tmpBoxes, (v: { position: number }) => {
		if (v.position > position) {
			v.position--
		}
	})

	setBoxes(tmpBoxes)
}

export function moveBoxDown({
	hiveId,
	index,
}: {
	hiveId: number
	index: number
}) {
	if (index === 0) {
		return false
	}

	const box = find(boxes, { hiveId, position: index })
	const bottom = find(boxes, { hiveId, position: index - 1 })

	if (!box || !bottom) {
		return false
	}

	remove(boxes, { hiveId, position: index })
	remove(boxes, { hiveId, position: index - 1 })

	box.position--
	bottom.position++

	boxes.push(box)
	boxes.push(bottom)

	//db.set('boxes', boxes)
	return true
}
