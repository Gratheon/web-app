import { getFrames } from '../models/frames.ts'
import {
	listFrameSideInspectionsByInspectionId,
	FrameSideInspectionRecord,
} from '../models/frameSideInspection.ts' // Import the new model function and record type
import { getFile } from '../models/files.ts' // Import file getter
import { getFileResizes } from '../models/fileResize.ts' // Import file resize getter
import { getFrameSideCells } from '../models/frameSideCells.ts' // Import cells getter

// these are the resolvers for the graphql schema
// used by urql to fetch data from the indexdb in offline mode
export default {
	user: async (_, { db }) => {
		return await db.user.limit(1).first()
	},
	apiaries: async (_, { db }) => {
		const apiaries = await db.apiary.limit(100).toArray()

		const apiariesWithHives = []

		for await (const apiary of apiaries) {
			const hives = await db.hive.limit(100).toArray()
			const hivesWithBoxes = []
			for await (const hive of hives) {
				const boxes = await db.box.limit(100).toArray()
				hivesWithBoxes.push({ ...hive, boxes })
			}
			apiariesWithHives.push({ ...apiary, hives: hivesWithBoxes })
		}

		return apiariesWithHives
	},

	hive: async (_, { db }, { variableValues: { id } }) => {
		const hive = await db.hive.where({ id }).first()

		if (!hive) {
			return
		}

		try {
			hive.family = await db.family.where({ hiveId: id }).first()
			//todo add file inside
			hive.boxes = await db.box.where({ hiveId: id }).toArray()

			for await (const box of hive.boxes) {
				box.frames = await getFrames({boxId: +box.id});
			}
		} catch (e) {
			console.error(e)
		}
		return hive
	},
	hiveFrameSideFile: async (_, { db }) => {
		return await db.framesidefile.limit(100).toArray()[0] // Assuming this table name is correct
	},
	frameSidesInspections: async (
		_,
		_args, // db is no longer needed directly here
		{ variableValues: { inspectionId } }
	) => {
		const inspectionIdNum = +inspectionId
		if (isNaN(inspectionIdNum)) {
			console.warn(
				`frameSidesInspections resolver: Invalid inspectionId: ${inspectionId}`
			)
			return []
		}

		// 1. Fetch the base inspection records
		const inspectionRecords =
			await listFrameSideInspectionsByInspectionId(inspectionIdNum)

		// 2. Fetch related data for each record
		const enrichedInspections = await Promise.all(
			inspectionRecords.map(async (record: FrameSideInspectionRecord) => {
				let fileData = null
				let cellsData = null

				// Fetch file and its resizes if fileId exists
				if (record.fileId) {
					fileData = await getFile(record.fileId)
					if (fileData) {
						// Ensure resizes is an array, even if null/undefined from DB
						fileData.resizes = (await getFileResizes({ file_id: record.fileId })) || []
					}
				}

				// Fetch cells data if cellsId exists
				if (record.cellsId) {
					cellsData = await getFrameSideCells(record.cellsId)
				}

				// Return the structure matching the GraphQL FrameSideInspection type
				return {
					__typename: 'FrameSideInspection', // Important for GraphQL client
					frameSideId: record.frameSideId,
					inspectionId: record.inspectionId,
					file: fileData,
					cells: cellsData,
					// frameSideFile: null, // Add if needed and fetched
				}
			})
		)

		return enrichedInspections
	},
}
