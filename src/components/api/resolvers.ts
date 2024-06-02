import { getFrames } from '@/components/models/frames';

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
		return await db.framesidefile.limit(100).toArray()[0]
	},
	frameSidesInspections: async (_, { db }, { variableValues: { inspectionId } }) => {
		return await db.frame_side_inspection.where({ inspectionId }).toArray()
	}
}
