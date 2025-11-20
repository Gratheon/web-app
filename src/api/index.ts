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
import { devtoolsExchange } from '@urql/devtools';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'

import {getShareToken, getToken} from '@/user'
import { gatewayUri, imageUploadUrl, subscriptionUri } from '@/uri'
import { writeHooks } from '@/models/db/writeHooks'

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

	// Dynamically set connection params based on available token
	connectionParams: () => {
		const shareToken = getShareToken();
		if (shareToken) {
			console.debug("Using shareToken for WebSocket connection");
			return { shareToken: shareToken };
		}
		const regularToken = getToken();
		if (regularToken) {
			console.debug("Using regular token for WebSocket connection");
			return { token: regularToken };
		}
		console.debug("No token available for WebSocket connection");
		return {}; // No token
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
		const shareToken = getShareToken();
		const regularToken = getToken();
		let headers = {};

		if (shareToken) {
			console.debug("Using X-Share-Token header for HTTP request");
			headers = { 'X-Share-Token': shareToken };
		} else if (regularToken) {
			console.debug("Using token header for HTTP request");
			headers = { 'token': regularToken };
		} else {
			console.debug("No token available for HTTP request headers");
		}

		return { headers };
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
