import { db } from './db'

export type FrameSideFile = {
    id?: number // same as frameSideId, just for indexing
    hiveId?: any // internal
    fileId: number
    frameSideId: number

    strokeHistory: any
    detectedBees: any
    detectedCells: any
    detectedQueenCups: any
    detectedVarroa: any

    detectedQueenCount: number
    detectedWorkerBeeCount: number
    detectedDroneCount: number
    varroaCount: number
    
    counts: any
    queenDetected?: boolean
}

export async function getFrameSideFile({ frameSideId }): Promise<FrameSideFile|null> {
    try {
        const row = await db['framesidefile'].get(+frameSideId)
        if (row) {
            if (!row.detectedBees) {
                row.detectedBees = []
            }

            if (!row.detectedCells) {
                row.detectedCells = []
            }

            if (!row.detectedQueenCups) {
                row.detectedQueenCups = []
            }
            
            if (!row.detectedVarroa) {
                row.detectedVarroa = []
            }
        }
        return row
    } catch (e) {
        console.error(e, {
            frameSideId
        })
        return null
    }
}

export async function updateFrameSideFile(data: FrameSideFile) {
    try {
        await db['framesidefile'].put(data)
    } catch (e) {
        console.error(e)
        throw e
    }
}

export async function setQueenPresense(frameSide: FrameSideFile, isPresent: boolean): Promise<FrameSideFile> {
    try {
        frameSide.queenDetected = isPresent;

        await db['framesidefile'].put(frameSide)

        return frameSide
    } catch (e) {
        console.error(e)
        throw e
    }
}

export async function deleteFilesByFrameSideIDs(frameSideIds: number[]) {
    try {
        await db['framesidefile'].where('frameSideId').anyOf(frameSideIds).delete()
    } catch (e) {
        console.error(e)
        throw e
    }
}