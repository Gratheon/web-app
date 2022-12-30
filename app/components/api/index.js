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

					return apiaries.map((apiary) => ({
						...apiary,
						hives: async () => {
							const hives = await db.hive.limit(100).toArray()
							return hives.map(async (hive) => {
								const boxes = await db.box.limit(100).toArray()
								return {
									...hive,
									boxes,
								}
							})
						},
					}))
				},

				hive: async (_, { db }, { variableValues: { id } }) => {
					const hive = await db.hive.where({ id }).first()
					console.log('hive', hive);

					if(!hive){
						return;
					}

					hive.family = await db.family.where({ hiveId: `${id}` }).first()
					hive.files = []
					hive.boxes = []
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
