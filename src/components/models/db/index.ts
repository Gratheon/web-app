//@ts-nocheck
import Dexie from 'dexie'
import { addCustomIndexes } from './addCustomIndexes'

const DB_NAME = 'gratheon'
export const db = new Dexie(DB_NAME, {
	autoOpen: true
})
Dexie.debug = 'dexie'

export async function dropDatabase(){
	return await db.delete()
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

			dbSchema[objName] = fieldStrings.join(', ')
		}
	}
	try {
		addCustomIndexes(dbSchema)
		db.version(2).stores(dbSchema)
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