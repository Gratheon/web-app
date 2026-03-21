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
const apolloClientHeaders: Record<string, string> = {
	'apollographql-client-name': 'web-app',
	'apollographql-client-version':
		import.meta.env.VITE_APP_VERSION || import.meta.env.MODE || 'dev',
}

function getRequestHeaders(): Record<string, string> {
	const shareToken = getShareToken();
	const regularToken = getToken();
	let headers: Record<string, string> = { ...apolloClientHeaders };

	if (shareToken) {
		headers = {
			...headers,
			'X-Share-Token': shareToken,
		};
	}

	if (regularToken) {
		headers = {
			...headers,
			'token': regularToken,
		};
	}

	return headers;
}

const graphqlWsClient = createClient({
	url: subscriptionUri(),
	keepAlive: 5_000,
	lazy: false,
	shouldRetry: () => true,

	// Dynamically set connection params based on available token
	connectionParams: () => {
		const regularToken = getToken();
		if (regularToken) {
			console.debug("Using regular token for WebSocket connection");
			return { token: regularToken };
		}
		const shareToken = getShareToken();
		if (shareToken) {
			// event-stream-filter currently authenticates only with `connectionParams.token`
			// and does not accept share tokens for websocket subscriptions.
			console.debug("Share token found, but no regular token available for WebSocket connection");
			return {};
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
		const headers = getRequestHeaders();
		if (!headers['X-Share-Token'] && !headers['token']) {
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
			fetchOptions: {
				headers: getRequestHeaders(),
			},
		})
	}
	return [opWrap, result]
}

function useQueryAdapted(query: string | TypedDocumentNode, options?: any) {
	const [result, reexecuteQuery] = useQuery({
		query,
		variables: options?.variables,
	})

	const hasData = result.data !== null && result.data !== undefined

	return {
		data: result.data,
		loading: result.fetching,
		error: result.error,
		//@ts-ignore
		errorNetwork: hasData ? null : result?.originalError,
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
