import { db, upsertEntityWithNumericID } from './db'

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

    isQueenDetectionComplete?: boolean
    isBeeDetectionComplete?: boolean
    isCellsDetectionComplete?: boolean
    isQueenCupsDetectionComplete?: boolean
    queenDetected?: boolean // Added this line

    counts: any
}

export const FRAME_SIDE_FILE_TABLE = 'frame_side_file'

export async function getFrameSideFile({ frameSideId }): Promise<FrameSideFile|null> {
    try {
        const row = await db[FRAME_SIDE_FILE_TABLE].get(+frameSideId)
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
        await db[FRAME_SIDE_FILE_TABLE].put(data)
    } catch (e) {
        console.error(e)
        throw e
    }
}


export async function deleteFilesByFrameSideIDs(frameSideIds: number[]) {
    try {
        await db[FRAME_SIDE_FILE_TABLE].where('frameSideId').anyOf(frameSideIds).delete()
    } catch (e) {
        console.error(e)
        throw e
    }
}

export default {
    upsertEntity: async function (entity: FrameSideFile, originalValue) {
        if (Object.keys(entity).length === 0) return

		delete entity.hiveId

		if (originalValue?.detectedCells) {
			entity.detectedCells = originalValue?.detectedCells;
		}

		entity.fileId = +originalValue?.file?.id;
		entity.frameSideId = +entity.frameSideId
		entity.id = +entity.frameSideId

		if (entity.id && entity.fileId) 
        {
			await upsertEntityWithNumericID(FRAME_SIDE_FILE_TABLE, entity)
		}
    }
}
