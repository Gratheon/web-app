import { db, upsertEntityWithNumericID } from "./db";
export type FileResize = {
	id: number
	file_id?: number
	url: string
	max_dimension_px: number
}

const TABLE_NAME = 'fileresize'

export async function upsertFileResize(entity: FileResize) {
	await upsertEntityWithNumericID(TABLE_NAME, entity)
}

export async function getFileResizes(where: { file_id?: number } = {}): Promise<FileResize[] | null> {
	// Validate file_id if provided
	if (where.hasOwnProperty('file_id')) {
		const fileId = where.file_id;
		if (!fileId || !Number.isFinite(fileId) || fileId <= 0) {
			console.warn(`Attempted to get fileResizes with invalid file_id: ${fileId}`);
			return []; // Return empty array for invalid file_id
		}
		// Ensure the file_id used in the query is a number
		where.file_id = +fileId;
	}

	if (!where) return [] // Keep original check for empty where clause

	try {
		return await db[TABLE_NAME].where(where).toArray()
	} catch (e) {
		console.error(e)
		return null
	}
}
