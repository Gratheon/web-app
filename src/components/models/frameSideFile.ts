import { db } from './db'

type FrameSideFile = {
    id?: number // same as frameSideId, just for indexing
    fileId: number
    frameSideId: number
    strokeHistory: any
    detectedBees: any
    detectedFrameResources: any
	counts: any
}
export async function getFrameSideFile({frameSideId}):Promise<FrameSideFile>{
    return await db['framesidefile'].get(+frameSideId)
}

export async function updateFrameSideFile(data: FrameSideFile){
    await db['framesidefile'].put(data)
}