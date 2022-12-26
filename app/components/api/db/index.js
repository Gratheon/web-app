import Dexie from 'dexie'
export const db = new Dexie('gratheon')

export function syncGraphqlSchemaToIndexDB(schemaObject) {
	const typeMap = schemaObject.getTypeMap()
	const dbSchema = {}
	for (const type of Object.values(typeMap)) {
		if (type.astNode && type.astNode.kind === 'ObjectTypeDefinition') {
			const objName = type.astNode.name.value.toLowerCase()

			if (objName === 'mutation' || objName === 'query' || objName === 'error') {
				continue
			}

			const fields = type.getFields()
			const fieldStrings = []
			for (const field of Object.values(fields)) {
				if (field.name == 'id') {
					field.name = `++id`;
				}
				fieldStrings.push(field.name)
			}

			if(!fieldStrings.includes('++id')){
				fieldStrings[0] = '++'+fieldStrings[0];
			}

			dbSchema[objName] = fieldStrings.join(', ')
		}
	}

	console.log('saving schema', dbSchema)
	db.version(1).stores(dbSchema)
}
