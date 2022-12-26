import { pipe, map } from 'wonka'
import { visit, TypeInfo, visitWithTypeInfo } from 'graphql'

import { db } from './db'

export function offlineIndexDbExchange({
	schemaObject,
	readResolvers,
	writeHooks,
}) {
	const typeInfo = new TypeInfo(schemaObject)
	return function exchange({ forward }) {
		return (operations) => {
			return pipe(
				operations,

				// read
				map((op) => {
					if (op.kind === 'query') {
						visit(
							op.query,
							visitWithTypeInfo(typeInfo, {
								Field: {
									async enter(node) {
										typeInfo.enter(node.name.value)
										const parentType = typeInfo.getParentType().name
										const propertyName = node.name.value

										// console.log('read', { parentType, propertyName })
										if (readResolvers?.[parentType]?.[propertyName]) {
											const result = await readResolvers[parentType][
												propertyName
											](node, op.variables, { db })

											if (result !== null) {
												// affect response?
											}
										}
									},
								},
							})
						)
					}
					return op
				}),
				forward,

				//write
				map((bubble) => {
					const op = bubble.operation
					const data = bubble.data

					// console.log('write!', { op, data })
					if (op.kind === 'query') {

						// first get typemap to know which write hooks to call
						// with what data from response that matches the schema
						const typeMap = {};
						visit(
							op.query,
							visitWithTypeInfo(typeInfo, {
								Field: {
									enter(node, key, parent, path, ancestors) {
										typeInfo.enter(node.name.value)
										const propertyName = node.name.value

										const ancestorsArr = [];
										for(let ancestor of ancestors){
											if(ancestor.kind=='Field'){
												ancestorsArr.push(ancestor.name.value);
											}
										}
										ancestorsArr.push(propertyName)

										typeMap[ancestorsArr.join('.')] = typeInfo.getType();
									},
								},
							})
						)

						// now traverse response data
						// and call correct write hooks
						traverse(data, typeMap, writeHooks);

					}
					return bubble
				})
			)
		}
	}
}

function traverse(obj, typeMap, writeHooks, path=[]) {
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key]

			// care only about high-level objects and arrays
			// scalars and properties are ignored as they are not supported as write hooks yet
			if (typeof value === 'object' && value!==null ) {
				const newPath = isNaN(key) ? [...path, key] : path
				const pathString = newPath.join('.');
				const objType = typeMap[pathString];

				if(!Array.isArray(value)){
					const tableName = objType.ofType ? objType.ofType.name : objType.name;

					// we reached some object that is no longer mapped onto a schema
					// must be some JSON, no point to continue
					if(tableName === 'JSON'){
						continue;
					}

					if(!tableName){
						console.error(pathString, value, tableName, objType)
						return;
					}
					console.log(pathString, value, tableName, objType)

					if (writeHooks?.[tableName]) {
						// normalize objects, clean them up from nested things
						const cleanedValue = Object.fromEntries(
							Object.entries(value).filter(([key, v]) => typeof v !== "object" && !Array.isArray(v))
						);

						if(cleanedValue?.id){
							// use strings
							cleanedValue.id = `${cleanedValue.id}`;
						}

						writeHooks[tableName](objType, cleanedValue, { db })
					}
				}

				// Recursively call the function if the value is an object or array
				traverse(value, typeMap, writeHooks, newPath)
			}
		}
	}
}
