//@ts-nocheck
import Dexie from 'dexie'
import { addCustomIndexes } from './addCustomIndexes'
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

export async function upsertEntity(entityName, entity) {
	entity.id = +entity.id

	try {		
		const ex = await db[entityName].get(entity.id)

		const updatedValue = {
			...ex,
			...entity,
		}
		// console.log(`updating entity ${entityName}`, {updatedValue, entity});
		await db[entityName].put(updatedValue)
	} catch (e) {
		console.error(e)
		throw e
	}
}
