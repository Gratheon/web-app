import { db } from '@/models/db'

export function toDateInputValue(date: Date) {
	if (Number.isNaN(date.getTime())) {
		return toDateInputValue(new Date())
	}

	return date.toISOString().slice(0, 10)
}

export function toStartOfDayIso(dateValue: string) {
	const parsed = new Date(`${dateValue}T00:00:00`)
	return Number.isNaN(parsed.getTime())
		? new Date().toISOString()
		: parsed.toISOString()
}

function getOldestPhotoDateInputValue(records: any[]) {
	const timestamps = records
		.map((record) => record?.capturedAt || record?.uploadedAt)
		.map((value) => new Date(value).getTime())
		.filter((value) => Number.isFinite(value))

	if (timestamps.length === 0) {
		return toDateInputValue(new Date())
	}

	return toDateInputValue(new Date(Math.min(...timestamps)))
}

export async function getSuggestedInspectionDate(frameSideIDs: number[]) {
	if (frameSideIDs.length === 0) {
		return toDateInputValue(new Date())
	}

	const frameSideFiles = await db['frame_side_file']
		.where('frameSideId')
		.anyOf(frameSideIDs)
		.toArray()
	const fileIds = frameSideFiles
		.map((record) => Number(record?.fileId))
		.filter((fileId) => Number.isFinite(fileId) && fileId > 0)

	if (fileIds.length === 0) {
		return getOldestPhotoDateInputValue(frameSideFiles)
	}

	const files = await db['file'].where('id').anyOf(fileIds).toArray()
	return getOldestPhotoDateInputValue([...frameSideFiles, ...files])
}
