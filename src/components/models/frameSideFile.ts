import { db } from './db'

type FrameSideFile = {
    id?: number // same as frameSideId, just for indexing
    fileId: number
    frameSideId: number
    strokeHistory: any
    detectedBees: any
    detectedFrameResources: any
    detectedQueenCups: any
	counts: any
}
export async function getFrameSideFile({frameSideId}):Promise<FrameSideFile>{
    const row = await db['framesidefile'].get(+frameSideId)
    if(row){
        if(!row.detectedBees){
            row.detectedBees = []
        }
        
        if(!row.detectedFrameResources){
            row.detectedFrameResources = []
        }

        if(!row.detectedQueenCups){
            row.detectedQueenCups = []
        }
    }
    return row
}

export async function updateFrameSideFile(data: FrameSideFile){
    await db['framesidefile'].put(data)
}