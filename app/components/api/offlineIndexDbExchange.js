import { pipe, map } from 'wonka'
import { visit, TypeInfo, visitWithTypeInfo } from 'graphql'

import { db } from './db';

export function offlineIndexDbExchange({ schemaObject, readResolvers, writeResolvers }) {
	const typeInfo = new TypeInfo(schemaObject)
	return function exchange({ forward }) {
		return (operations) => {
			return pipe(
				operations,
				map((op) => {
					if (op.kind === 'query') {
						visit(
							op.query,
							visitWithTypeInfo(typeInfo, {
								Field: {
									enter(node) {
										typeInfo.enter(node.name.value)
										const parentType = typeInfo.getParentType().name
										const propertyName = node.name.value

										// console.log('read', { parentType, propertyName })
										if (readResolvers?.[parentType]?.[propertyName]) {
											readResolvers[parentType][propertyName](
												node,
												op.variables,
												{ db }
											)
										}
									},
								},
							})
						)
					}
					return op
				}),
				forward,
				map((bubble) => {
					const op = bubble.operation
					const data = bubble.data;

					// console.log('write!', {op, data});
					if (op.kind === 'query') {
						visit(
							op.query,
							visitWithTypeInfo(typeInfo, {
								Field: {
									enter(node) {
										typeInfo.enter(node.name.value)
										const parentType = typeInfo.getParentType().name
										const propertyName = node.name.value

										// console.log('write', { parentType, propertyName })
										if (writeResolvers?.[parentType]?.[propertyName]) {
											writeResolvers[parentType][propertyName](
												node,
												op.variables,
												{ db, data }
											)
										}
									},
								},
							})
						)
					}
					return bubble
				}),
			)
		}
	}
}
