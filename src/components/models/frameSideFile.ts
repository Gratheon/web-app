import { db } from './db'

type FrameSideFile = {
    id?: number // same as frameSideId, just for indexing
    fileId: number
    frameSideId: number
    strokeHistory: any
    detectedObjects: any
}
export async function getFrameSideFile({frameSideId}):Promise<FrameSideFile>{
    return await db['framesidefile'].get(+frameSideId)
}

export async function updateFrameSideFile(data: FrameSideFile){
    await db['framesidefile'].put(data)
}