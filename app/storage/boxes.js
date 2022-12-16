import find from 'lodash/find'
import filter from 'lodash/filter'
import remove from 'lodash/remove'
import orderBy from 'lodash/orderBy'
import map from 'lodash/map'

import db from './db'

let boxes = db.get('boxes')

export const boxTypes = {
	DEEP: 'DEEP',
	SUPER: 'SUPER',
}

export function getBoxes(where = () => true) {
	let t = filter(boxes, where)
	t = orderBy(t, ['position'], ['desc'])
	return t
}

export function setBoxes(data, where) {
	remove(boxes, where)
	data.forEach((row) => {
		boxes.push({ ...row, ...where })
	})

	db.set('boxes', boxes)
}

export function addBox({ hiveId, boxType }) {
	hiveId = parseInt(hiveId, 10)
	const tmpBoxes = getBoxes({
		hiveId,
	})

	boxes.push({
		position: tmpBoxes.length,
		hiveId,
		type: boxType,
	})
	db.set('boxes', boxes)
}

export function removeBox({ hiveId, position }) {
	hiveId = parseInt(hiveId, 10)
	const tmpBoxes = getBoxes({
		hiveId,
	})

	remove(tmpBoxes, {
		hiveId,
		position,
	})

	map(tmpBoxes, (v) => {
		if (v.position > position) {
			v.position--
		}
	})

	setBoxes(tmpBoxes)
}

export function moveBoxDown({ hiveId, index }) {
	if (index === 0) {
		return false
	}

	hiveId = parseInt(hiveId, 10)

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
