import { db } from "./db";

export async function getFile(id:number){
	return await db['file'].get(+id);
}