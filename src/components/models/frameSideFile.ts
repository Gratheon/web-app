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
    counts: any
    queenDetected?: boolean
}

export async function getFrameSideFile({ frameSideId }): Promise<FrameSideFile> {
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
    }
    return row
}

export async function updateFrameSideFile(data: FrameSideFile) {
    try {
        await db['framesidefile'].put(data)
    } catch (e) {
        console.error(e)
        throw e
    }
}


export async function toggleQueen(frameSide: FrameSideFile): Promise<FrameSideFile> {
	frameSide.queenDetected = !frameSide.queenDetected;

	await db['framesidefile'].put(frameSide)

	return frameSide
}