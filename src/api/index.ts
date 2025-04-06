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
import { devtoolsExchange } from '@urql/devtools'; // Correct import path
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'

import {getShareToken, getToken} from '../user.ts'
import { gatewayUri, imageUploadUrl, subscriptionUri } from '../uri.ts'
import { writeHooks } from '../models/db/writeHooks.ts'

import { schemaObject } from './schema.ts'
import { offlineIndexDbExchange } from './offlineIndexDbExchange.ts'
import resolvers from './resolvers.ts'

let uri = gatewayUri()


let lastNetworkError = null

const graphqlWsClient = createClient({
	url: subscriptionUri(),
	keepAlive: 5_000,
	lazy: false,
	shouldRetry: () => true,

	connectionParams: {
		token: getToken(),
		// shareToken: getShareToken(),
	},
})


const apiClient = createUrqlClient({
	url: uri,
	exchanges: [
		devtoolsExchange, // Add devtoolsExchange (includes logging)
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

		//@ts-ignore
		multipartFetchExchange,
	],
	fetchOptions: () => {
		return {
			headers: {
				token: getToken(),
				// shareToken: getShareToken(),
			},
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
