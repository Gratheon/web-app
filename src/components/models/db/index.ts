//@ts-nocheck
import Dexie from 'dexie'
export const db = new Dexie('gratheon')
Dexie.debug = 'dexie'

export function syncGraphqlSchemaToIndexDB(schemaObject) {
	const typeMap = schemaObject.getTypeMap()
	const dbSchema = {}
	for (const type of Object.values(typeMap)) {
		if (type.astNode && type.astNode.kind === 'ObjectTypeDefinition') {
			const objName = type.astNode.name.value.toLowerCase()

			if (
				objName === 'mutation' ||
				objName === 'query' ||
				objName === 'error'
			) {
				continue
			}

			const fields = type.getFields()
			const fieldStrings = []
			for (const field of Object.values(fields)) {
				fieldStrings.push(field.name == 'id' ? '&id' : field.name)
			}

			dbSchema[objName] = fieldStrings.join(', ')
		}
	}
	try {
		addCustomIndexes(dbSchema)

		//console.info('saving schema', dbSchema)
		db.version(1).stores(dbSchema)
	} catch (e) {
		console.error(e)
		throw e
	}
}

function addCustomIndexes(dbSchema) {
	dbSchema.family += ',hiveId'
	dbSchema.box += ',hiveId'
	dbSchema.file += ',hiveId'
	dbSchema.frame += ',boxId,hiveId,leftId,rightId'
	dbSchema.frameside += ',frameId'
}

async function upsertEntity(entityName, entity) {
	entity.id = +entity.id

	try {
		const ex = await db[entityName].get(entity.id)

		await db[entityName].put({
			...ex,
			...entity,
		})
	} catch (e) {
		console.error(e)
		throw e
	}
}

export const writeHooks = {
	Apiary: async (_, apiary) => await upsertEntity('apiary', apiary),
	Hive: async (_, hive) => await upsertEntity('hive', hive),
	Box: async (parent, box) => {
		box.hiveId = +parent.id
		await upsertEntity('box', box)
	},
	Family: async ({ id }, family) => {
		family.hiveId = +id
		await upsertEntity('family', family)
	},
	Frame: async ({ id }, value, { originalValue: frame }) => {
		frame.boxId = +id

		if (frame.leftSide) {
			value.leftId = +frame.leftSide?.id
		}

		if (frame.rightSide) {
			value.rightId = +frame.rightSide?.id
		}

		await upsertEntity('frame', value)
	},
	FrameSide: async ({ id }, frameside) => {
		frameside.frameId = +id
		await upsertEntity('frameside', frameside)
	},
	FrameSideFile: async (_, frameSideFile) => {
		if (Object.keys(frameSideFile).length === 0) return

		frameSideFile.id = +frameSideFile.frameSideId
		await upsertEntity('framesidefile', frameSideFile)
	},
	File: async ({ hiveId }, file) => {
		file.hiveId = +hiveId
		await upsertEntity('file', file)
	},
	User: async (_, user) => await upsertEntity('user', user),
}
