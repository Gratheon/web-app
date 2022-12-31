import { pipe, fromValue, mergeMap, fromPromise } from 'wonka'
import { execute, visit, TypeInfo, visitWithTypeInfo } from 'graphql'

import { db } from './db'

// An alternative offline-first URQL exchange with custom resolvers
// some compromises:
// 1. requires all graphql queries to include id for every requested property
// 2. you must implement read resolvers yourself
// 3. you must implement cache writing yourself
// 4. not opinionated on how to tie entities together
// so either backend must return parentIds that you will use in read resolvers
// or cache writing must add relation IDs
export function offlineIndexDbExchange({
	cacheFirst,
	schemaObject,
	resolvers,
	writeHooks,
}) {
	const typeInfo = new TypeInfo(schemaObject)
	async function onOperation(op) {
		// use this if you want to use cache-first strategy
		// but I'm not sure how to prevent network requests (forward function calls within a pipe)

		if (cacheFirst) {
			if (op.kind === 'query') {
				op.cacheResult = await execute({
					schema: schemaObject,
					document: op.query,
					rootValue: resolvers,
					contextValue: {
						db,
					},
					variableValues: op.variables,
				})
			}
		}
		return op
	}

	function onError() {}

	async function onResult(bubble) {
		const op = bubble.operation
		const data = bubble.data

		// mutations/subscriptions/teardowns are pass-through
		if (op.kind !== 'query') {
			return bubble
		}

		// if we want to rely on cache-first, make sure to use data from previous step
		if(cacheFirst){
			if(bubble.operation?.cacheResult){
				bubble.error = bubble.operation.cacheResult.errors ? bubble.operation.cacheResult.errors[0] : null;
				bubble.data = bubble.operation.cacheResult.data;
			}
		}
		// if its network-first and we get a network error, use fetch offline cache
		else {
			if (bubble.error) {
				bubble.data = (
					await execute({
						schema: schemaObject,
						document: op.query,
						rootValue: resolvers,
						contextValue: {
							db,
						},
						variableValues: op.variables,
					})
				).data
			}
		}

		// if there is a network error and we have offline cache, use that
		if(bubble.error && bubble.data){
			bubble.originalError = bubble.error;
			bubble.error = null;

			return bubble;
		}


		// so now its network-first and we had no error
		// fill cache, go through response and call writeHooks

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
		await traverseResponse(null, data, typeMap, writeHooks)
		return bubble
	}

	return function exchange({ forward }) {
		return (operations) => {
			return pipe(
				pipe(
					operations,
					mergeMap((operation) => {
						const newOperation =
							(onOperation && onOperation(operation)) || operation
						return 'then' in newOperation
							? fromPromise(newOperation)
							: fromValue(newOperation)
					})
				),
				forward,
				mergeMap((result) => {
					if (onError && result.error) onError(result.error, result.operation)
					const newResult = (onResult && onResult(result)) || result
					return 'then' in newResult
						? fromPromise(newResult)
						: fromValue(newResult)
				})
			)
		}
	}
}

async function traverseResponse(parent, response, typeMap, writeHooks, path = []) {
	for (const key in response) {
		if (response.hasOwnProperty(key)) {
			const value = response[key]

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
								([key, v]) => {
									const propType = typeMap[`${pathString}.${key}`]
									return typeof v !== 'object' && !Array.isArray(v) || propType.name==='JSON'
								}
							)
						)

						if (cleanedValue?.id) {
							// use strings
							cleanedValue.id = `${cleanedValue.id}`
						}

						try{
							await writeHooks[tableName](parent, cleanedValue, { db }, { objType })
						} catch(e){
							console.error(e);
						}
					}
				}

				// Recursively call the function if the value is an object or array

				const parentToPass = Array.isArray(value) ? parent : value;
				traverseResponse(parentToPass, value, typeMap, writeHooks, newPath)
			}
		}
	}
}
