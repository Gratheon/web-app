import isDev from './isDev'

export function subscriptionUri() {
	let uri = 'wss://subscribe.gratheon.com/graphql'

	if (isDev()) {
		// event-stream-filter
		uri = 'ws://' + window.location.host.split(':')[0] + ':8350/graphql'
	}
	return uri
}

export function gatewayUri() {
	let uri = 'https://graphql.gratheon.com/graphql'

	if (isDev()) {
		// graphql-router
		uri = 'http://' + window.location.host.split(':')[0] + ':6100/graphql'
	}
	return uri
}

export function imageUploadUrl() {
	let uri = 'https://image.gratheon.com/graphql'

	if (isDev()) {
		// image-splitter
		uri = 'http://' + window.location.host.split(':')[0] + ':8800/graphql'
	}
	return uri
}
export function videoUploadUri() {
	let uri = 'https://video.gratheon.com/graphql'

	if (isDev()) {
		// gate-video-stream
		uri = 'http://' + window.location.host.split(':')[0] + ':8900/graphql'
	}
	return uri
}

export function getAppUri() {
	return 'http://' + window.location.host
}
