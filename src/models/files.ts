import { db } from "./db";
import { FileResize } from "./fileResize.ts";

export type File = {
	id: number
	url: string
	resizes: [FileResize]
	capturedAt?: string
	uploadedAt?: string
}

export function getPhotoTimestamps(file?: globalThis.File) {
	const uploadedAt = new Date().toISOString()
	const lastModified = file?.lastModified

	// Browsers expose the original file timestamp as File.lastModified. It is the
	// best available client-side proxy for photo capture time without parsing EXIF.
	if (typeof lastModified === 'number' && Number.isFinite(lastModified) && lastModified > 0) {
		return {
			capturedAt: new Date(lastModified).toISOString(),
			uploadedAt,
		}
	}

	return { uploadedAt }
}

const TABLE_NAME = 'file'

export async function getFile(id: number): Promise<File> {
	try {
		return await db[TABLE_NAME].get(+id);
	} catch (e) {
		console.error(e)
		throw e
	}
}


export async function updateFile(data: File) {
	try {
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}