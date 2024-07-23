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

import { getToken } from '@/components/user'
import { gatewayUri, imageUploadUrl, subscriptionUri } from '@/components/uri'
import { syncGraphqlSchemaToIndexDB } from '@/components/models/db'
import { writeHooks } from '@/components/models/db/writeHooks'

import { schemaObject } from './schema'
import { offlineIndexDbExchange } from './offlineIndexDbExchange'
import resolvers from './resolvers'

let uri = gatewayUri()


let lastNetworkError = null

const graphqlWsClient = createClient({
	url: subscriptionUri(),
	keepAlive: 5_000,
	lazy: false,
	shouldRetry: () => true,

	connectionParams: {
		token: getToken(),
	},
})


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
	}
})

function useMutationAdapted(
	query: string | TypedDocumentNode,
	variables?: any
): [any, { data: any; loading: boolean; error: any }] {
	//@ts-ignore
	const [result, op] = useMutation(query, variables)
	//@ts-ignore
	return [op, result]
}

function useUploadMutation(query: string | TypedDocumentNode, url = imageUploadUrl()) {
	const [result, op] = useMutation(query)
	function opWrap(payload) {
		return op(payload, {
			url,
		})
	}
	return [opWrap, result]
}

function useQueryAdapted(query: string | TypedDocumentNode, options?: any) {
	const [result, reexecuteQuery] = useQuery({
		query,
		variables: options?.variables,
	})


	return {
		data: result.data,
		loading: result.fetching,
		error: result.error,
		//@ts-ignore
		errorNetwork: result?.originalError,
		reexecuteQuery
	}
}

function useSubscriptionAdapted(
	query: string | TypedDocumentNode,
	variables?: any,
	handleSubscription?: any
) {
	const [result] = useSubscription({ query, variables }, handleSubscription)

	return result
}

export {
	lastNetworkError,
	graphqlWsClient,
	apiClient,
	useUploadMutation,
	useQueryAdapted as useQuery,
	useMutationAdapted as useMutation,
	useSubscriptionAdapted as useSubscription,
	gql,
}
