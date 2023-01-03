import { useEffect, useState } from 'react'

export default function connectionStatus({graphqlWsClient}) {
	const [wsStatus, setWsStatus] = useState(null)

	useEffect(() => {
		graphqlWsClient.on('connected', () => {
			setWsStatus('green')
		})

		graphqlWsClient.on('closed', () => {
			setWsStatus('red')
		})

		graphqlWsClient.on('error', () => {
			setWsStatus('orange')
		})
	}, [graphqlWsClient])

	return (
		<div
			title="Event delivery status"
			style={{
				width: 6,
				height: 6,
				borderRadius: 3,
				background: wsStatus,
			}}
		></div>
	)
}
