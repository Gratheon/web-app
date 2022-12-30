import { pipe, filter, make, fromValue, map, mergeMap, fromPromise, onEnd, takeUntil } from 'wonka'
import { visit, TypeInfo, visitWithTypeInfo } from 'graphql'
import { makeResult } from 'urql'

import { db } from './db'

export function offlineIndexDbExchange({
	schemaObject,
	readResolvers,
	writeHooks,
}) {
	const typeInfo = new TypeInfo(schemaObject)
	async function onOperation(op){
		if (op.kind === 'query') {
			let resolverCalls = []
			let keys = []
			visit(
				op.query,
				visitWithTypeInfo(typeInfo, {
					Field: {
						enter(node) {
							typeInfo.enter(node.name.value)
							const parentType = typeInfo.getParentType().name
							const propertyName = node.name.value

							if (readResolvers?.[parentType]?.[propertyName]) {
								keys.push(`${parentType}.${propertyName}`)
								resolverCalls.push(
									readResolvers[parentType][propertyName](
										node,
										op.variables,
										{ db }
									)
								)
							}
						},
					},
				})
			)

			if (keys.length > 0) {
				op.cacheResult = {}

				const results = await Promise.all(resolverCalls)
				for (let i = 0; i < keys.length; i++) {
					op.cacheResult[keys[i]] = results[i]
				}
			}
		}
		return op;
	}

	function onError(){}

	function onResult(bubble){
		const op = bubble.operation
		const data = bubble.data

		console.log('op.cacheResult', op?.cacheResult)

		if (op.kind === 'query') {
			// first get typemap to know which write hooks to call
			// with what data from response that matches the schema
			const typeMap = {}
			visit(
				op.query,
				visitWithTypeInfo(typeInfo, {
					Field: {
						enter(node, key, parent, path, ancestors) {
							typeInfo.enter(node.name.value)
							const propertyName = node.name.value

							const ancestorsArr = []
							for (let ancestor of ancestors) {
								if (ancestor.kind == 'Field') {
									ancestorsArr.push(ancestor.name.value)
								}
							}
							ancestorsArr.push(propertyName)

							typeMap[ancestorsArr.join('.')] = typeInfo.getType()
						},
					},
				})
			)

			// now traverse response data
			// and call correct write hooks
			traverse(data, typeMap, writeHooks)
		}
		return bubble
	}


	return function exchange({ forward }) {
		return (operations) => {
			return pipe(
				pipe(
					operations,
				  mergeMap(operation => {
					const newOperation =
					  (onOperation && onOperation(operation)) || operation;
					return 'then' in newOperation
					  ? fromPromise(newOperation)
					  : fromValue(newOperation);
				  })
				),
				forward,
				mergeMap(result => {
				  if (onError && result.error) onError(result.error, result.operation);
				  const newResult = (onResult && onResult(result)) || result;
				  return 'then' in newResult
					? fromPromise(newResult)
					: fromValue(newResult);
				})
			  );
		}
	}
}

function traverse(obj, typeMap, writeHooks, path = []) {
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key]

			// care only about high-level objects and arrays
			// scalars and properties are ignored as they are not supported as write hooks yet
			if (typeof value === 'object' && value !== null) {
				const newPath = isNaN(key) ? [...path, key] : path
				const pathString = newPath.join('.')
				const objType = typeMap[pathString]

				if (!Array.isArray(value)) {
					const tableName = objType.ofType ? objType.ofType.name : objType.name

					// we reached some object that is no longer mapped onto a schema
					// must be some JSON, no point to continue
					if (tableName === 'JSON') {
						continue
					}

					if (!tableName) {
						console.error(pathString, value, tableName, objType)
						return
					}
					// console.log(pathString, value, tableName, objType)

					if (writeHooks?.[tableName]) {
						// normalize objects, clean them up from nested things
						const cleanedValue = Object.fromEntries(
							Object.entries(value).filter(
								([key, v]) => typeof v !== 'object' && !Array.isArray(v)
							)
						)

						if (cleanedValue?.id) {
							// use strings
							cleanedValue.id = `${cleanedValue.id}`
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
