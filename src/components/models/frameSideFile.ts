import { db } from './db'

export async function frameSideFile({frameSideId}){
    return await db['framesidefile'].get({frameSideId: +frameSideId})
}