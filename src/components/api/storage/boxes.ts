import find from 'lodash/find'
import filter from 'lodash/filter'
import remove from 'lodash/remove'
import orderBy from 'lodash/orderBy'
import map from 'lodash/map'

import db from './db'
import { Box } from '../schema'

let boxes: Box[] = db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
}

export function getBoxes(where: any = () => true): Box[] {
	let t = filter(boxes, where)
	t = orderBy(t, ['position'], ['desc'])
	return t
}

export function setBoxes(data: any[], where: any | null = null) {
	remove(boxes, where)
	data.forEach((row: any) => {
		boxes.push({ ...row, ...where })
	})

	db.set('boxes', boxes)
}

export function addBox({
	hiveId,
	boxType,
}: {
	hiveId: string
	boxType: string
}) {
	const tmpBoxes = getBoxes({
		hiveId,
	})

	// @ts-ignore
	boxes.push({
		position: tmpBoxes.length,
		hiveId,
		type: boxType,
	})
	db.set('boxes', boxes)
}

export function removeBox({
	hiveId,
	position,
}: {
	hiveId: string
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
	hiveId: string
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

	db.set('boxes', boxes)
	return true
}