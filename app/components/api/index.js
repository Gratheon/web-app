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
import { syncGraphqlSchemaToIndexDB } from './db'

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

syncGraphqlSchemaToIndexDB(schemaObject)

const apiClient = createUrqlClient({
	url: uri,
	exchanges: [
		dedupExchange,

		offlineIndexDbExchange({
			schemaObject,
			readResolvers: {
				Query: {
					apiaries: async (_, __, { db }) => {
						return await db.apiary
						.limit(1)
						.toArray();
					},
				},
			},
			writeHooks: {
				Apiary: async(_, apiary, { db }) => await db.apiary.put(apiary),
				Hive: async(_, hive, { db }) => await db.hive.put(hive),
				Box: async(_, box, { db }) => await db.box.put(box),
				Frame: async(_, frame, { db }) => await db.frame.put(frame),
				FrameSide: async(_, frameside, { db }) => await db.frameside.put(frameside),
				FrameSideFile: async(_, frameSideFile, { db }) => await db.framesidefile.put(frameSideFile),
				File: async(_, file, { db }) => await db.file.put(file),
				User: async(_, user, { db }) => await db.user.put(user),
			},
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
