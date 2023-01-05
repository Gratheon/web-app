import { remove, filter, orderBy } from 'lodash'

let files = []; //db.get('files')

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

	//db.set('files', files)
}

export function getFrameSideFile({
	hiveId,
	frameSideId,

	boxIndex = null,
	position = null,
	side = null,
}: {
	hiveId: number
	frameSideId: number

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
	frameSideId: number
	hiveId: number
	strokeHistory: any
}) {
	const file = getFrameSideFile({
		frameSideId: +frameSideId,
		hiveId: +hiveId,
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
	hiveId: number
	boxIndex: string
	position: number
	side: string
	uploadedFile: any
}) {
	//@ts-ignore
	hiveId = parseInt(hiveId, 10)

	setFiles([uploadedFile], { hiveId, boxIndex, position, side })
}
