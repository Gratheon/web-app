import { db } from "./db";

export async function getFile(id:number){
	console.log('fetching file', id);
	return await db['file'].get(+id);
}