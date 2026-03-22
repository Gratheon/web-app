import { getFrames } from '@/models/frames'
import {
	listFrameSideInspectionsByInspectionId,
	FrameSideInspectionRecord,
} from '@/models/frameSideInspection'
import { getFile } from '@/models/files'
import { getFileResizes } from '@/models/fileResize'
import { getFrameSideCells } from '@/models/frameSideCells'

// these are the resolvers for the graphql schema
// used by urql to fetch data from the indexdb in offline mode
export default {
	user: async (_, { db }) => {
		return await db.user.limit(1).first()
	},
	apiary: async (_, { db }, { variableValues: { id } }) => {
		const apiaryId = Number(id)
		if (!Number.isFinite(apiaryId)) {
			return null
		}

		const apiary = await db.apiary.where({ id: apiaryId }).first()
		if (!apiary) {
			return null
		}

		const allHives = await db.hive.limit(500).toArray()
		const hasApiaryRelations = allHives.some((hive) => hive?.apiaryId != null || hive?.apiary_id != null)
		const apiaryHives = allHives.filter((hive) => {
			if (!hasApiaryRelations) {
				return true
			}
			const hiveApiaryId = hive?.apiaryId ?? hive?.apiary_id
			return String(hiveApiaryId) === String(apiary.id)
		})

		const hiveIds = apiaryHives.map((hive) => Number(hive?.id)).filter((hiveId) => Number.isFinite(hiveId))
		const families = hiveIds.length > 0
			? await db.family.where('hiveId').anyOf(hiveIds).toArray()
			: []
		const familyByHiveId = new Map(families.map((family) => [String(family?.hiveId), family]))

		const hives = apiaryHives.map((hive) => ({
			...hive,
			family: familyByHiveId.get(String(hive?.id)) || null,
		}))

		return {
			...apiary,
			hives,
		}
	},
	apiaries: async (_, { db }) => {
		const apiaries = await db.apiary.limit(100).toArray()
		const allHives = await db.hive.limit(500).toArray()
		const allBoxes = await db.box.limit(2000).toArray()
		const hasApiaryRelations = allHives.some((hive) => hive?.apiaryId != null || hive?.apiary_id != null)

		const apiariesWithHives = []

		for await (const apiary of apiaries) {
			const apiaryHives = allHives.filter((hive) => {
				// Backward compatibility: if old cache entries have no apiaryId and there is
				// only one cached apiary, keep showing those hives.
				if (!hasApiaryRelations && apiaries.length === 1) {
					return true
				}
				const hiveApiaryId = hive?.apiaryId ?? hive?.apiary_id
				return String(hiveApiaryId) === String(apiary.id)
			})

			const hivesWithBoxes = apiaryHives.map((hive) => {
				const boxes = allBoxes
					.filter((box) => String(box?.hiveId ?? box?.hive_id) === String(hive.id))
					.sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0))
				return { ...hive, boxes }
			})

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
