import { db } from './db'

type FrameSideFile = {
    fileId: number
    frameSideId: number
    strokeHistory: any
    detectedObjects: any
}
export async function getFrameSideFile({frameSideId}):Promise<FrameSideFile>{
    return await db['framesidefile'].get(+frameSideId)
}