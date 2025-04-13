import { db } from './db'
import { File } from './files' // Assuming File type is defined here
import { FrameSideCells } from './frameSideCells' // Assuming FrameSideCells type is defined here
// import { FrameSideFile } from './frameSideFile'; // Assuming FrameSideFile type is defined here - uncomment if needed

export const FRAME_SIDE_INSPECTION_TABLE = 'frame_side_inspection'

// Interface matching the GraphQL type structure (input/output for functions)
export interface FrameSideInspection {
	frameSideId: number | string
	inspectionId: number | string
	file?: Partial<File> & { id: number | string } // Expect at least ID from normalization
	cells?: Partial<FrameSideCells> & { id: number | string } // Expect at least ID
	// frameSideFile?: Partial<FrameSideFile> & { id: number | string }; // Expect at least ID - uncomment if needed
	// Add other fields if they exist in the GraphQL type
}

// Interface representing the record stored in Dexie
// Includes the synthetic primary key and stores IDs for related entities
export interface FrameSideInspectionRecord {
	id: string // Synthetic primary key: `${inspectionId}_${frameSideId}`
	frameSideId: number
	inspectionId: number
	fileId?: number
	cellsId?: number
	// frameSideFileId?: number; // uncomment if needed
}

/**
 * Creates or updates a record in the frame_side_inspection Dexie table.
 * Generates the synthetic primary key and extracts IDs from related objects.
 * @param inspection - The FrameSideInspection object (likely from GraphQL response/write hook).
 */
export async function upsertFrameSideInspection(
	inspection: FrameSideInspection
): Promise<string> {
	if (!inspection || !inspection.inspectionId || !inspection.frameSideId) {
		console.error(
			'upsertFrameSideInspection: Invalid input, missing inspectionId or frameSideId',
			inspection
		)
		// Consider throwing an error or returning a specific value indicating failure
		return ''
	}

	const inspectionIdNum = +inspection.inspectionId
	const frameSideIdNum = +inspection.frameSideId

	if (isNaN(inspectionIdNum) || isNaN(frameSideIdNum)) {
		console.error(
			'upsertFrameSideInspection: inspectionId or frameSideId is not a number',
			inspection
		)
		return ''
	}

	const record: FrameSideInspectionRecord = {
		id: `${inspectionIdNum}_${frameSideIdNum}`,
		inspectionId: inspectionIdNum,
		frameSideId: frameSideIdNum,
		fileId: inspection.file?.id ? +inspection.file.id : undefined,
		cellsId: inspection.cells?.id ? +inspection.cells.id : undefined,
		// frameSideFileId: inspection.frameSideFile?.id ? +inspection.frameSideFile.id : undefined, // uncomment if needed
	}

	try {
		// Use Dexie's put method which handles both insert and update
		const resultingId = await db
			.table<FrameSideInspectionRecord>(FRAME_SIDE_INSPECTION_TABLE)
			.put(record)
		return resultingId as string // Returns the primary key (our synthetic ID)
	} catch (e) {
		console.error(
			`Error upserting frame side inspection ${record.id}:`,
			e,
			record
		)
		throw e // Re-throw the error for upstream handling
	}
}

/**
 * Retrieves all frame side inspection records for a given inspection ID.
 * @param inspectionId - The ID of the inspection.
 * @returns A promise that resolves to an array of FrameSideInspectionRecord objects.
 */
export async function listFrameSideInspectionsByInspectionId(
	inspectionId: number
): Promise<FrameSideInspectionRecord[]> {
	if (!inspectionId || isNaN(+inspectionId)) {
		console.warn(
			`listFrameSideInspectionsByInspectionId: Invalid inspectionId provided: ${inspectionId}`
		)
		return []
	}

	try {
		return await db
			.table<FrameSideInspectionRecord>(FRAME_SIDE_INSPECTION_TABLE)
			.where({ inspectionId: +inspectionId })
			.toArray()
	} catch (e) {
		console.error(
			`Error listing frame side inspections for inspectionId ${inspectionId}:`,
			e
		)
		throw e // Re-throw the error
	}
}

/**
 * Retrieves a single frame side inspection record by its synthetic ID.
 * @param id - The synthetic ID ('inspectionId_frameSideId').
 * @returns A promise that resolves to the FrameSideInspectionRecord or undefined if not found.
 */
export async function getFrameSideInspectionById(
	id: string
): Promise<FrameSideInspectionRecord | undefined> {
	if (!id) {
		console.warn(`getFrameSideInspectionById: Invalid id provided: ${id}`)
		return undefined
	}
	try {
		return await db
			.table<FrameSideInspectionRecord>(FRAME_SIDE_INSPECTION_TABLE)
			.get(id)
	} catch (e) {
		console.error(`Error getting frame side inspection by id ${id}:`, e)
		throw e
	}
}
