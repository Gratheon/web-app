import { db } from "./db";

export type FileResize = {
	id: number
	url: string
}

export type File = {
	id: number
	url: string
	resizes: [FileResize]
}

export async function getFile(id: number): Promise<File> {
	try {
		return await db['file'].get(+id);
	} catch (e) {
		console.error(e)
		throw e
	}
}


export async function updateFile(data: File) {
	try {
		return await db['file'].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}