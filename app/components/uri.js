import isDev from './isDev'

export function gatewayUri() {
	let uri = 'https://graphql.gratheon.com/graphql'

	if (isDev()) {
		// graphql-router
		uri = 'http://' + window.location.host.split(':')[0] + ':6100/graphql'
	}
	return uri
}
export function uploadUri() {
	let uri = 'https://image.gratheon.com/graphql'

	if (isDev()) {
		uri = 'http://' + window.location.host.split(':')[0] + ':17000/graphql'
	}
	return uri
}

export function getAppUri() {
	return 'http://' + window.location.host
}
