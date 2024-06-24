//@ts-nocheck
import Dexie from 'dexie'
import { addCustomIndexes } from './addCustomIndexes'
import { FRAME_SIDE_CELL_TN } from '../frameSideCells'

const DB_NAME = 'gratheon'
const DB_VERSION = 3

export const db = new Dexie(DB_NAME, {
	autoOpen: true
})
Dexie.debug = 'dexie'

export async function dropDatabase(){
	return await db.delete()
}

const graphqlToTableMap = {
	'framesidecells': FRAME_SIDE_CELL_TN,
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
		db.version(DB_VERSION).stores(dbSchema)
	} catch (e) {
		console.error(e)
		throw e
	}
}

// Generic function to updated IndexedDB table with graphql response
export async function upsertEntityWithNumericID(entityName, entity) {
	if(!entity.id){
		console.error("Cannot store entity without ID for type " + entityName + '. Did you forget including id in query?', entity)
		return 
	}

	entity.id = +entity.id

	return upsertEntity(entityName, entity)
}

export async function upsertEntity(entityName, entity) {
	try {
		const ex = await db[entityName].get(entity.id)

		const updatedValue = {
			...ex,
			...entity,
		}
		await db[entityName].put(updatedValue)
	} catch (e) {
		console.error(e)
		throw e
	}
}