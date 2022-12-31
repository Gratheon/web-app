import { createClient } from 'graphql-ws'
import {
	createClient as createUrqlClient,
	useQuery,
	useMutation,
	useSubscription,
	gql,
	subscriptionExchange,
	dedupExchange,
} from 'urql'
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'

import { getToken, isLoggedIn } from '../user'
import { gatewayUri, getAppUri, uploadUri } from '../uri'
import { schemaObject } from './schema.js'
import { offlineIndexDbExchange } from './offlineIndexDbExchange'
import { db, syncGraphqlSchemaToIndexDB, writeHooks } from './db'

let uri = gatewayUri()

if (!isLoggedIn()) {
	if (typeof window !== 'undefined') {
		if (!window.location.pathname.match('/account')) {
			window.location = getAppUri() + '/account/authenticate/'
		}
	}
}

let lastNetworkError = null
let lastGraphQLErrors = []

const graphqlWsClient = createClient({
	url: 'ws://localhost:8350/graphql',
	keepAlive: 5_000,
	lazy: false,
	shouldRetry: () => true,

	connectionParams: {
		token: getToken(),
	},
})

// create index db schema out of graphql schema
syncGraphqlSchemaToIndexDB(schemaObject)

const apiClient = createUrqlClient({
	url: uri,
	exchanges: [
		dedupExchange,

		offlineIndexDbExchange({
			cacheFirst: true,
			schemaObject,
			resolvers: {
				user: async (_, { db }) => {
					return await db.user.limit(1).first()
				},
				apiaries: async (_, { db }) => {
					const apiaries = await db.apiary.limit(100).toArray()

					const apiariesWithHives = []

					for await (const apiary of apiaries) {
						const hives = await db.hive.limit(100).toArray()
						const hivesWithBoxes = []
						for await (const hive of hives) {
							const boxes = await db.box.limit(100).toArray()
							hivesWithBoxes.push({ ...hive, boxes })
						}
						apiariesWithHives.push({ ...apiary, hives: hivesWithBoxes })
					}

					return apiariesWithHives
				},

				hive: async (_, { db }, { variableValues: { id } }) => {
					const hive = await db.hive.where({ id }).first()

					if (!hive) {
						return
					}

					try {
						hive.family = await db.family.where({ hiveId: `${id}` }).first()
						//todo add file inside
						// hive.files = []; //await db.framesidefile.where({ hiveId: `${id}`}).toArray()
						hive.boxes = await db.box.where({ hiveId: `${id}` }).toArray()

						for await (const box of hive.boxes) {
							box.frames = await db.frame
								.where({ boxId: `${box.id}` })
								.toArray()

							for await (const frame of box.frames) {
								const frames = await db.frameside
									.where({ frameId: `${frame.id}` })
									.toArray()

								frame.leftSide = frames[0]
								frame.rightSide = frames[1]
							}
						}
					} catch (e) {
						console.error(e)
					}
					return hive
				},
				hiveFrameSideFile: async () => {
					return await db.framesidefile.limit(100).toArray()[0]
				},
			},
			writeHooks,
		}),

		subscriptionExchange({
			forwardSubscription: (operation) => ({
				subscribe: (sink) => ({
					unsubscribe: graphqlWsClient.subscribe(operation, sink),
				}),
			}),
		}),
		multipartFetchExchange,
	],
	fetchOptions: () => {
		return {
			headers: { token: getToken() },
		}
	},
})

function omitTypeName(obj) {
	return JSON.parse(JSON.stringify(obj), (key, v) =>
		key === '__typename' ? undefined : v
	)
}
function useMutationAdapted(query, options) {
	const [result, op] = useMutation(query, options)
	return [op, result]
}

function useUploadMutation(query) {
	const [result, op] = useMutation(query)
	function opWrap(payload) {
		return op(payload, {
			url: uploadUri(),
		})
	}
	return [opWrap, result]
}

function useQueryAdapted(query, options) {
	const [result] = useQuery({
		query,
		variables: options?.variables,
	})
	return {
		data: result.data,
		loading: result.fetching,
		error: result.error,
	}
}

function useSubscriptionAdapted(query, variables) {
	const [result] = useSubscription({ query, variables })

	return result
}
export {
	lastNetworkError,
	lastGraphQLErrors,
	omitTypeName,
	graphqlWsClient,
	apiClient,
	useUploadMutation,
	useQueryAdapted as useQuery,
	useMutationAdapted as useMutation,
	useSubscriptionAdapted as useSubscription,
	gql,
}
