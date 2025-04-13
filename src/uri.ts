import { USE_PROD_BACKEND_FOR_DEV } from './config'

import isDev from './isDev'

export function grafanaUri() {
	let uri = 'https://grafana.gratheon.com/'

	if (isDev()) {
		// event-stream-filter
		uri = 'http://' + window.location.host.split(':')[0] + ':9000/'
	}
	return uri
}

export function subscriptionUri() {
	let uri = 'wss://subscribe.gratheon.com/graphql'

	if (isDev() && !USE_PROD_BACKEND_FOR_DEV) {
		// event-stream-filter
		uri = 'ws://' + window.location.host.split(':')[0] + ':8350/graphql'
	}
	return uri
}

export function gatewayUri() {
	let uri = 'https://graphql.gratheon.com/graphql'

	if (isDev() && !USE_PROD_BACKEND_FOR_DEV) {
		// graphql-router
		// Use localhost instead of 0.0.0.0 for Tauri compatibility
		uri = 'http://localhost:6100/graphql'
	}
	return uri
}

export function imageUploadUrl() {
	let uri = 'https://image.gratheon.com/graphql'

	if (isDev() && !USE_PROD_BACKEND_FOR_DEV) {
		// image-splitter
		uri = 'http://' + window.location.host.split(':')[0] + ':8800/graphql'
	}
	return uri
}
export function videoUploadUri() {
	let uri = 'https://video.gratheon.com/graphql'

	if (isDev() && !USE_PROD_BACKEND_FOR_DEV) {
		// gate-video-stream
		uri = 'http://' + window.location.host.split(':')[0] + ':8900/graphql'
	}
	return uri
}

export function getAppUri() {
	return 'http://' + window.location.host
}
