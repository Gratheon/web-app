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

export async function getFrameSideFile({ frameSideId }: { frameSideId: number }): Promise<FrameSideFile | undefined> {
    // Validate frameSideId before querying
    if (!frameSideId || !Number.isFinite(frameSideId) || frameSideId <= 0) {
        console.warn(`Attempted to get frameSideFile with invalid ID: ${frameSideId}`);
        return undefined; // Return undefined for invalid IDs
    }

    try {
        // Ensure ID passed to Dexie is a number
        const row = await db[FRAME_SIDE_FILE_TABLE].get(+frameSideId);
        if (row) {
            // Ensure arrays exist
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

// Define payload structure for appendBeeDetectionData
interface BeeDetectionPayload {
    delta: any[];
    detectedQueenCount: number;
    detectedWorkerBeeCount: number;
    detectedDroneCount: number;
    isBeeDetectionComplete: boolean;
}

// Helper function to create a unique key for a bee detection
// Assuming x, y, n are sufficient for uniqueness within a frameSide
const getBeeKey = (bee: { x: number; y: number; n: number | string }) => `${bee.x}-${bee.y}-${bee.n}`;

// New function using modify for atomic updates with deduplication
export async function appendBeeDetectionData(frameSideId: number, payload: BeeDetectionPayload) {
    try {
        await db[FRAME_SIDE_FILE_TABLE].where({ id: frameSideId }).modify((frameSideFile) => {
            if (!frameSideFile.detectedBees || !Array.isArray(frameSideFile.detectedBees)) {
                frameSideFile.detectedBees = [];
            }
            // console.log(`appendBeeDetectionData (${frameSideId}): Before append, existing length: ${frameSideFile.detectedBees.length}`); // Removed log

            // Deduplicate incoming delta against existing bees
            if (payload.delta && Array.isArray(payload.delta) && payload.delta.length > 0) {
                const existingKeys = new Set(frameSideFile.detectedBees.map(getBeeKey));
                const uniqueNewBees = payload.delta.filter(newBee => !existingKeys.has(getBeeKey(newBee)));
                // console.log(`appendBeeDetectionData (${frameSideId}): Incoming delta length: ${payload.delta.length}, Unique new bees: ${uniqueNewBees.length}`); // Removed log

                if (uniqueNewBees.length > 0) {
                    frameSideFile.detectedBees.push(...uniqueNewBees);
                }
            }

            // Update counts and completion flag directly
            // Note: Counts might become slightly inaccurate if backend sends duplicates,
            // but the visual representation will be correct.
            // Alternatively, recalculate counts based on the final deduplicated array if needed.
            frameSideFile.detectedQueenCount = payload.detectedQueenCount;
            frameSideFile.detectedWorkerBeeCount = payload.detectedWorkerBeeCount;
            frameSideFile.detectedDroneCount = payload.detectedDroneCount;
            frameSideFile.isBeeDetectionComplete = payload.isBeeDetectionComplete;

            // console.log(`appendBeeDetectionData (${frameSideId}): After append, final length: ${frameSideFile.detectedBees.length}`); // Removed log
        });
        console.log("Successfully appended bee data for frameSideId:", frameSideId); // Keep outer log
    } catch (e) {
        console.error("Error appending bee detection data:", e, { frameSideId, payload });
        // Optionally re-throw or handle specific Dexie errors (e.g., ModifyError)
        throw e;
    }
}

// Define payload structure for appendQueenDetectionData
interface QueenDetectionPayload {
    delta: any[]; // Queen detections also go into detectedBees
    isQueenDetectionComplete: boolean;
}

// New function using modify for atomic queen updates with deduplication
export async function appendQueenDetectionData(frameSideId: number, payload: QueenDetectionPayload) {
    try {
        await db[FRAME_SIDE_FILE_TABLE].where({ id: frameSideId }).modify((frameSideFile) => {
            if (!frameSideFile.detectedBees || !Array.isArray(frameSideFile.detectedBees)) {
                frameSideFile.detectedBees = [];
            }

            let queenFoundInDelta = false;
            if (payload.delta && Array.isArray(payload.delta) && payload.delta.length > 0) {
                const existingKeys = new Set(frameSideFile.detectedBees.map(getBeeKey));
                const uniqueNewQueens = payload.delta.filter(newQueen => !existingKeys.has(getBeeKey(newQueen)));

                if (uniqueNewQueens.length > 0) {
                    frameSideFile.detectedBees.push(...uniqueNewQueens);
                    // Increment queen count based on *unique* new queens found
                    frameSideFile.detectedQueenCount = (frameSideFile.detectedQueenCount || 0) + uniqueNewQueens.length;
                    queenFoundInDelta = true; // Set flag if at least one unique queen was added
                }
            }

            // Update queen flags based on whether a *unique* queen was found in this delta or previously
            frameSideFile.queenDetected = queenFoundInDelta ? true : (frameSideFile.queenDetected ?? false);
            frameSideFile.isQueenDetectionComplete = payload.isQueenDetectionComplete;
        });
        console.log("Successfully appended queen data for frameSideId:", frameSideId);
    } catch (e) {
        console.error("Error appending queen detection data:", e, { frameSideId, payload });
        throw e;
    }
}

// Define payload structure for appendResourceDetectionData
interface ResourceDetectionPayload {
    delta: any[];
    isCellsDetectionComplete: boolean;
    broodPercent: number;
    cappedBroodPercent: number;
    eggsPercent: number;
    pollenPercent: number;
    honeyPercent: number;
}

// New function using modify for atomic resource updates
export async function appendResourceDetectionData(frameSideId: number, payload: ResourceDetectionPayload) {
    try {
        await db[FRAME_SIDE_FILE_TABLE].where({ id: frameSideId }).modify((frameSideFile) => {
            if (!frameSideFile.detectedCells || !Array.isArray(frameSideFile.detectedCells)) {
                frameSideFile.detectedCells = [];
            }
            if (payload.delta && Array.isArray(payload.delta)) {
                frameSideFile.detectedCells.push(...payload.delta);
            }
            frameSideFile.isCellsDetectionComplete = payload.isCellsDetectionComplete;
            frameSideFile.broodPercent = payload.broodPercent;
            frameSideFile.cappedBroodPercent = payload.cappedBroodPercent;
            frameSideFile.eggsPercent = payload.eggsPercent;
            frameSideFile.pollenPercent = payload.pollenPercent;
            frameSideFile.honeyPercent = payload.honeyPercent;
        });
        console.log("Successfully appended resource data for frameSideId:", frameSideId);
    } catch (e) {
        console.error("Error appending resource data:", e, { frameSideId, payload });
        throw e;
    }
}

// Define payload structure for appendQueenCupDetectionData
interface QueenCupDetectionPayload {
    delta: any[];
    isQueenCupsDetectionComplete: boolean;
}

// New function using modify for atomic queen cup updates
export async function appendQueenCupDetectionData(frameSideId: number, payload: QueenCupDetectionPayload) {
    try {
        await db[FRAME_SIDE_FILE_TABLE].where({ id: frameSideId }).modify((frameSideFile) => {
            if (!frameSideFile.detectedQueenCups || !Array.isArray(frameSideFile.detectedQueenCups)) {
                frameSideFile.detectedQueenCups = [];
            }
            if (payload.delta && Array.isArray(payload.delta)) {
                frameSideFile.detectedQueenCups.push(...payload.delta);
            }
            frameSideFile.isQueenCupsDetectionComplete = payload.isQueenCupsDetectionComplete;
        });
        console.log("Successfully appended queen cup data for frameSideId:", frameSideId);
    } catch (e) {
        console.error("Error appending queen cup data:", e, { frameSideId, payload });
        throw e;
    }
}

// New function using modify for atomic stroke history updates
export async function updateStrokeHistoryData(frameSideId: number, strokeHistory: any) {
    try {
        await db[FRAME_SIDE_FILE_TABLE].where({ id: frameSideId }).modify((frameSideFile) => {
            frameSideFile.strokeHistory = strokeHistory;
        });
        console.log("Successfully updated stroke history for frameSideId:", frameSideId);
    } catch (e) {
        console.error("Error updating stroke history:", e, { frameSideId });
        throw e;
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
