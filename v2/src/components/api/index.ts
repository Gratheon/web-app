import { createClient } from 'graphql-ws'
import {
	createClient as createUrqlClient,
	useQuery,
	useMutation,
	useSubscription,
	gql,
	subscriptionExchange,
	dedupExchange,
	TypedDocumentNode,
} from 'urql'
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'

import { getToken, isLoggedIn } from '../user'
import { gatewayUri, getAppUri, uploadUri } from '../uri'
import { schemaObject } from './schema'
import { offlineIndexDbExchange } from './offlineIndexDbExchange'
import { syncGraphqlSchemaToIndexDB, writeHooks } from './db'
import resolvers from './resolvers';

let uri = gatewayUri()

if (!isLoggedIn()) {
	if (typeof window !== 'undefined') {
		if (!window.location.pathname.match('/account')) {
			window.location.href = getAppUri() + '/account/authenticate/'
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

		//@ts-ignore
		offlineIndexDbExchange({
			cacheFirst: false,
			schemaObject,
			resolvers,
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
function useMutationAdapted(query: string|TypedDocumentNode, variables?:any):[any, {data:any, loading:boolean, error:any}] {
	//@ts-ignore
	const [result, op] = useMutation(query, variables)
	//@ts-ignore
	return [op, result]
}

function useUploadMutation(query: string|TypedDocumentNode) {
	const [result, op] = useMutation(query)
	function opWrap(payload) {
		return op(payload, {
			url: uploadUri(),
		})
	}
	return [opWrap, result]
}

function useQueryAdapted(query: string|TypedDocumentNode, options?:any) {
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

function useSubscriptionAdapted(query: string|TypedDocumentNode, variables?: any) {
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
