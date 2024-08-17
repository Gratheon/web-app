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

export async function getFileResizes(where = {}): Promise<FileResize[] | null> {
	if (!where) return []
	try {
		return await db[TABLE_NAME].where(where).toArray()
	} catch (e) {
		console.error(e)
		return null
	}
}