import { db } from "./db";
import { FileResize } from "./fileResize.ts";

export type File = {
	id: number
	url: string
	resizes: [FileResize]
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