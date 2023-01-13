import { db } from "./db";

export type File = {
	id: number
	url: string
}

export async function getFile(id:number): Promise<File>{
	return await db['file'].get(+id);
}


export async function updateFile(data: File){
    return await db['file'].put(data)
}