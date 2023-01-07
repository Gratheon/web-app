import { db } from './db'

export async function getFrameSideFile({frameSideId}){
    return await db['framesidefile'].get({frameSideId: +frameSideId})
}