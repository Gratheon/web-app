import { db } from './db'

type FrameSideFile = {
    fileId: number
    frameSideId: number
    strokeHistory: any
    detectedObjects: any
}
export async function getFrameSideFile({frameSideId}):Promise<FrameSideFile>{
    console.log('fetching framesidefile', frameSideId);
    return await db['framesidefile'].get(+frameSideId)
}