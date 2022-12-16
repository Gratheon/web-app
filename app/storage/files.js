import remove from 'lodash/remove'
import filter from 'lodash/filter'
import orderBy from 'lodash/orderBy'

import db from './db'

let files = db.get('files')

export function getFiles(where = {}) {
	return orderBy(filter(files, where), ['position'], ['asc'])
}

export function setFiles(data, where) {
	remove(files, where)

	if (data) {
		data.forEach((row) => {
			files.push({ ...row, ...where })
		})
	}

	db.set('files', files)
}

export function getFrameSideFile({
	hiveId,
	frameSideId,

	boxIndex,
	position,
	side,
}) {
	let file
	hiveId = parseInt(hiveId, 10)

	if (frameSideId) {
		file = filter(files, {
			hiveId,
			frameSideId,
		})[0]
	} else {
		file = filter(files, {
			hiveId,
			boxIndex,
			position,
			side,
		})[0]
	}

	if (!file) {
		return null
	}

	return file
}

export function setFileStroke({ frameSideId, hiveId, strokeHistory }) {
	const file = getFrameSideFile({
		frameSideId,
		hiveId,
	})
	file.strokeHistory = strokeHistory
}

export function setFrameSideFile({
	hiveId,

	boxIndex,
	position,
	side,
	uploadedFile,
}) {
	hiveId = parseInt(hiveId, 10)

	setFiles([uploadedFile], { hiveId, boxIndex, position, side })
}
