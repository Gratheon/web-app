import { useEffect, useState } from 'preact/hooks'

import T from '@/shared/translate'

import styles from './styles.module.less'

type WsStatus = 'green' | 'red' | 'orange' | null

function statusLabel(status: WsStatus) {
	if (status === 'green') {
		return <T>Connected</T>
	}
	if (status === 'red') {
		return <T>Disconnected</T>
	}
	if (status === 'orange') {
		return <T>Error</T>
	}
	return <T>Unknown</T>
}

export default function EventApiStatus({ graphqlWsClient }) {
	const [wsStatus, setWsStatus] = useState<WsStatus>(null)

	useEffect(() => {
		// WHY: graphql-ws `on()` returns disposers; unsubscribe on unmount so the tokens page does not leak listeners.
		const offConnected = graphqlWsClient.on('connected', () => {
			setWsStatus('green')
		})
		const offClosed = graphqlWsClient.on('closed', () => {
			setWsStatus('red')
		})
		const offError = graphqlWsClient.on('error', () => {
			setWsStatus('orange')
		})

		return () => {
			offConnected()
			offClosed()
			offError()
		}
	}, [graphqlWsClient])

	return (
		<section className={styles.section}>
			<h2>
				<T>Event API status</T>
			</h2>
			<div className={styles.status} role="status">
				<span
					className={styles.dot}
					style={{ background: wsStatus || '#bbbbbb' }}
					title="Event API status"
					data-status={wsStatus || 'unknown'}
				/>
				<span className={styles.label}>{statusLabel(wsStatus)}</span>
			</div>
		</section>
	)
}
