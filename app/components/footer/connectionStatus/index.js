import { useEffect, useState } from 'react'
import { graphqlWsClient } from '../../api'

export default function connectionStatus() {
	const [wsStatus, setWsStatus] = useState(null)

	useEffect(() => {
		graphqlWsClient.on('connected', () => {
			setWsStatus('connected')
		})

		graphqlWsClient.on('closed', () => {
			setWsStatus('disconnect')
		})

		graphqlWsClient.on('error', () => {
			setWsStatus('error')
		})
	}, [])

	return (
		<div
			style={{
				width: 6,
				height: 6,
				borderRadius: 3,
				background: wsStatus === 'connected' ? 'green' : 'red',
			}}
		></div>
	)
}
