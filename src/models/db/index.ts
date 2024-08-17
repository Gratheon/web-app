//@ts-nocheck
import Dexie from 'dexie'
import { addCustomIndexes } from './addCustomIndexes.ts'
import { FRAME_SIDE_CELL_TABLE } from '../frameSideCells.ts'
import { FRAME_SIDE_FILE_TABLE } from '../frameSideFile.ts'
import { has } from 'lodash'

const DB_NAME = 'gratheon'
const DB_VERSION = 8

export const db = new Dexie(DB_NAME, {
	autoOpen: true
})
Dexie.debug = 'dexie'

export async function dropDatabase() {
	await db.delete()
	await db.close();
}

const graphqlToTableMap = {
	'framesidecells': FRAME_SIDE_CELL_TABLE,
	'framesidefile': FRAME_SIDE_FILE_TABLE,
}

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

			let table_name = objName
			if (graphqlToTableMap[objName]) {
				table_name = graphqlToTableMap[objName]
			}

			dbSchema[table_name] = fieldStrings.join(', ')
		}
	}


	try {
		addCustomIndexes(dbSchema)

		console.log('Setting up db schema', dbSchema)
		db.version(DB_VERSION).stores(dbSchema) // createObjectStore
	} catch (e) {
		console.error(e)
		throw e
	}
}

// Generic function to updated IndexedDB table with graphql response
export async function upsertEntityWithNumericID(entityName, entity) {
	if (!entity){
		console.trace('No entity name provided for type ' + entityName + ', this may be a bug and degrade performance')
		return
	}

	if (!entity.id) {
		console.warn("Cannot store entity without ID for type " + entityName + '. Did you forget including id in query?', entity)
		return
	}

	entity.id = +entity.id

	return upsertEntity(entityName, entity)
}

export async function upsertEntity(entityName, entity) {
	try {
		entityName = entityName.toLowerCase()
		
		const ex = await db[entityName].get(entity.id)
		let updatedValue = { ...entity }

		if (ex) {
			updatedValue = {
				...ex,
				...updatedValue,
			}
		}

		await db[entityName].put(updatedValue)
	} catch (e) {
		console.error(e, entity)
		throw e
	}
}