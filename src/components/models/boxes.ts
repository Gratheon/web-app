import find from 'lodash/find'
import remove from 'lodash/remove'

import { Box } from '@/components/api/schema'

import { db } from './db'

let boxes: Box[] = [] // db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
}

export async function getBoxes(where = {}): Promise<Box[]> {
	try {
		return await db['box'].where(where).sortBy('position')
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function countHiveBoxes(hiveId: number) {
	try {
		return await db['box']
			.where({
				hiveId,
			})
			.count()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function removeBox(id: number) {
	try {
		return await db['box'].delete(id)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export function setBoxes(data: any[], where: any | null = null) {
	remove(boxes, where)
	data.forEach((row: any) => {
		boxes.push({ ...row, ...where })
	})
}

export async function addBox({
	id,
	hiveId,
	position,
	type,
}: {
	id: number
	hiveId: number
	position: number
	type: string
}) {
	try {
		await db['box'].put({
			id,
			hiveId,
			position,
			type,
		})
	} catch (e) {
		console.error(e)
		throw e
	}
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
