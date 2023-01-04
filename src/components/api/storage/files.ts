import { remove, filter, orderBy } from 'lodash'

import db from './db'

let files = db.get('files')

export function getFiles(where = {}) {
	return orderBy(filter(files, where), ['position'], ['asc'])
}

export function setFiles(data: any, where: any) {
	remove(files, where)

	if (data) {
		data.forEach((row: any) => {
			files.push({ ...row, ...where })
		})
	}

	db.set('files', files)
}

export function getFrameSideFile({
	hiveId,
	frameSideId,

	boxIndex = null,
	position = null,
	side = null,
}: {
	hiveId: string
	frameSideId: string

	boxIndex?: number | null
	position?: number | null
	side?: string | null
}) {
	let file

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

export function setFileStroke({
	frameSideId,
	hiveId,
	strokeHistory,
}: {
	frameSideId: string
	hiveId: string
	strokeHistory: any
}) {
	// @ts-ignore
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
}: {
	hiveId: string
	boxIndex: string
	position: number
	side: string
	uploadedFile: any
}) {
	//@ts-ignore
	hiveId = parseInt(hiveId, 10)

	setFiles([uploadedFile], { hiveId, boxIndex, position, side })
}
