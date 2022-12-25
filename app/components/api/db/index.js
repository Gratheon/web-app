import Dexie from 'dexie'
export const db = new Dexie('gratheon')

export function syncGraphqlSchemaToIndexDB(schemaObject) {
	const typeMap = schemaObject.getTypeMap()
	const dbSchema = {}
	for (const type of Object.values(typeMap)) {
		if (type.astNode && type.astNode.kind === 'ObjectTypeDefinition') {
			const fields = type.getFields()
			const fieldStrings = ['++id']
			for (const field of Object.values(fields)) {
				if (field.name != 'id') {
					fieldStrings.push(field.name)
				}
			}

			const objName = type.astNode.name.value.toLowerCase()

			if (objName === 'mutation' || objName === 'query') {
				continue
			}

			dbSchema[objName] = fieldStrings.join(', ')
		}
	}

	console.log('saving schema', dbSchema)
	db.version(1).stores(dbSchema)
}
