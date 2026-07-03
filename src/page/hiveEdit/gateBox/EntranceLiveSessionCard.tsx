import React, { useEffect, useRef, useState } from 'react'

import { gql, useMutation, useQuery } from '@/api'
import { getToken } from '@/user'
import Button from '@/shared/button'
import T from '@/shared/translate'

import styles from './styles.module.less'

type LiveSessionStatus =
	| 'REQUESTED'
	| 'DEVICE_OFFLINE'
	| 'STARTING'
	| 'ACTIVE'
	| 'STOPPING'
	| 'STOPPED'
	| 'FAILED'

type LiveSession = {
	id: string
	boxId: string
	status: LiveSessionStatus
	playbackUrl?: string | null
	expiresAt?: string | null
	qualityProfile?: string | null
	recordingMode?: string | null
	relayProtocol?: string | null
	clipHandoffEnabled?: boolean | null
	handoffStreamId?: string | null
	lastKeepaliveAt?: string | null
	lastDeviceSeenAt?: string | null
	lastErrorCode?: string | null
	lastErrorMessage?: string | null
	relayDetails?: {
		relayProtocol?: string | null
		placeholder?: boolean | null
		publisherUrl?: string | null
		publishToken?: string | null
		signalingToken?: string | null
		playbackUrl?: string | null
		frameContentType?: string | null
		playbackContentType?: string | null
	} | null
}

const ENTRANCE_LIVE_SESSION_FIELDS = gql`
	fragment EntranceLiveSessionFields on EntranceLiveStreamSession {
		id
		boxId
		status
		playbackUrl
		expiresAt
		qualityProfile
		recordingMode
		relayProtocol
		clipHandoffEnabled
		handoffStreamId
		lastKeepaliveAt
		lastDeviceSeenAt
		lastErrorCode
		lastErrorMessage
		relayDetails {
			relayProtocol
			placeholder
			publisherUrl
			publishToken
			signalingToken
			playbackUrl
			frameContentType
			playbackContentType
		}
	}
`

const ENTRANCE_LIVE_SESSION_QUERY = gql`
	query entranceLiveStreamSessionForBox($boxId: ID!) {
		entranceLiveStreamSession(boxId: $boxId) {
			...EntranceLiveSessionFields
		}
	}
	${ENTRANCE_LIVE_SESSION_FIELDS}
`

const START_ENTRANCE_LIVE_STREAM_MUTATION = gql`
	mutation startEntranceLiveStreamForBox($boxId: ID!, $qualityProfile: String, $recordingMode: String) {
		startEntranceLiveStream(boxId: $boxId, qualityProfile: $qualityProfile, recordingMode: $recordingMode) {
			...EntranceLiveSessionFields
		}
	}
	${ENTRANCE_LIVE_SESSION_FIELDS}
`

const KEEP_ENTRANCE_LIVE_STREAM_ALIVE_MUTATION = gql`
	mutation keepEntranceLiveStreamAliveForSession($sessionId: ID!) {
		keepEntranceLiveStreamAlive(sessionId: $sessionId) {
			...EntranceLiveSessionFields
		}
	}
	${ENTRANCE_LIVE_SESSION_FIELDS}
`

const STOP_ENTRANCE_LIVE_STREAM_MUTATION = gql`
	mutation stopEntranceLiveStreamForSession($sessionId: ID!) {
		stopEntranceLiveStream(sessionId: $sessionId)
	}
`

const POLL_INTERVAL_MS = 5_000
const KEEPALIVE_INTERVAL_MS = 30_000
const KEEPALIVE_STATUSES: LiveSessionStatus[] = ['REQUESTED', 'DEVICE_OFFLINE', 'STARTING', 'ACTIVE']

type EntranceLiveSessionCardProps = {
	boxId: string | number
	hasConnectedDevice: boolean
}

function getLiveStatusText(status: LiveSessionStatus) {
	return {
		REQUESTED: <T>Connecting</T>,
		DEVICE_OFFLINE: <T>Camera offline</T>,
		STARTING: <T>Starting camera</T>,
		ACTIVE: <T>Live</T>,
		STOPPING: <T>Stopping</T>,
		STOPPED: <T>Not live</T>,
		FAILED: <T>Needs attention</T>,
	}[status]
}

function LiveStatusBadge({ status }: { status: LiveSessionStatus }) {
	const className = {
		REQUESTED: styles.statusRequested,
		DEVICE_OFFLINE: styles.statusOffline,
		STARTING: styles.statusStarting,
		ACTIVE: styles.statusActive,
		STOPPING: styles.statusStopping,
		STOPPED: styles.statusStopped,
		FAILED: styles.statusFailed,
	}[status]

	return <span className={`${styles.statusBadge} ${className}`}>{getLiveStatusText(status)}</span>
}

function LiveStatusDescription({
	status,
	hasConnectedDevice,
}: {
	status: LiveSessionStatus
	hasConnectedDevice: boolean
}) {
	switch (status) {
		case 'REQUESTED':
			return <T>We are asking the entrance camera to start. This usually takes a few seconds.</T>
		case 'DEVICE_OFFLINE':
			return hasConnectedDevice
				? <T>The connected camera is offline. Check that the device is powered on and connected to the internet.</T>
				: <T>Connect a camera device above to start live viewing for this entrance.</T>
		case 'STARTING':
			return <T>The camera is starting. The live image will appear here when the first frame arrives.</T>
		case 'ACTIVE':
			return <T>The entrance camera is live. Watch the latest image directly on this page.</T>
		case 'STOPPING':
			return <T>Stopping the live view.</T>
		case 'FAILED':
			return <T>The live view could not start. Please try again or check the camera device.</T>
		case 'STOPPED':
		default:
			return <T>No live view is running right now. Start it when you want to check the entrance.</T>
	}
}

function appendBytes(previous: Uint8Array, next: Uint8Array) {
	const merged = new Uint8Array(previous.length + next.length)
	merged.set(previous)
	merged.set(next, previous.length)
	return merged
}

function findJpegEnd(bytes: Uint8Array) {
	for (let index = 1; index < bytes.length; index += 1) {
		if (bytes[index - 1] === 0xff && bytes[index] === 0xd9) return index + 1
	}
	return -1
}

function findJpegStart(bytes: Uint8Array, frameEnd: number) {
	for (let index = 0; index < frameEnd - 1; index += 1) {
		if (bytes[index] === 0xff && bytes[index + 1] === 0xd8) return index
	}
	return -1
}

function MjpegLivePreview({ playbackUrl, isActive }: { playbackUrl: string; isActive: boolean }) {
	const [frameUrl, setFrameUrl] = useState('')
	const [previewError, setPreviewError] = useState('')
	const [retryAttempt, setRetryAttempt] = useState(0)

	useEffect(() => {
		if (!isActive || !playbackUrl) {
			setFrameUrl('')
			setPreviewError('')
			return
		}

		const token = getToken()
		if (!token) {
			setPreviewError('Please sign in again to view the live camera.')
			return
		}
		const controller = new AbortController()
		let buffer = new Uint8Array(0)
		let reconnectTimer: number | null = null

		function scheduleReconnect(message?: string) {
			if (controller.signal.aborted) return
			if (message) setPreviewError(message)
			reconnectTimer = window.setTimeout(() => {
				setRetryAttempt((attempt) => attempt + 1)
			}, 2500)
		}

		function updateFrame(nextFrame: Uint8Array) {
			const nextObjectUrl = URL.createObjectURL(new Blob([nextFrame], { type: 'image/jpeg' }))
			setFrameUrl((previousUrl) => {
				if (previousUrl) URL.revokeObjectURL(previousUrl)
				return nextObjectUrl
			})
		}

		async function readStream() {
			try {
				setPreviewError('')
				const response = await fetch(playbackUrl, {
					headers: { token },
					signal: controller.signal,
				})

				if (!response.ok || !response.body) {
					scheduleReconnect('Live camera is not ready yet. Reconnecting...')
					return
				}

				const reader = response.body.getReader()
				while (!controller.signal.aborted) {
					const { done, value } = await reader.read()
					if (done) break
					if (!value) continue

					buffer = appendBytes(buffer, value)

					let frameEnd = findJpegEnd(buffer)
					while (frameEnd > -1) {
						const frameStart = findJpegStart(buffer, frameEnd)
						if (frameStart > -1 && frameStart < frameEnd) {
							updateFrame(buffer.slice(frameStart, frameEnd))
						}
						buffer = buffer.slice(frameEnd)
						frameEnd = findJpegEnd(buffer)
					}

					// WHY: keep malformed multipart data from growing memory forever while waiting for the next JPEG.
					if (buffer.length > 2_000_000) buffer = buffer.slice(-200_000)
				}

				if (!controller.signal.aborted) {
					scheduleReconnect('Live camera connection closed. Reconnecting...')
				}
			} catch (error) {
				if (!controller.signal.aborted) {
					scheduleReconnect('Live camera preview is temporarily unavailable. Reconnecting...')
				}
			}
		}

		void readStream()

		return () => {
			controller.abort()
			if (reconnectTimer) window.clearTimeout(reconnectTimer)
			setFrameUrl((previousUrl) => {
				if (previousUrl) URL.revokeObjectURL(previousUrl)
				return ''
			})
		}
	}, [isActive, playbackUrl, retryAttempt])

	return (
		<div className={styles.livePreviewFrame}>
			{frameUrl ? (
				<img src={frameUrl} alt="Live entrance camera preview" />
			) : (
				<div className={styles.livePreviewPlaceholder}>
					<strong><T>Waiting for camera image</T></strong>
					<span>
						{previewError || <T>The live view will appear here as soon as the camera sends a frame.</T>}
					</span>
				</div>
			)}
		</div>
	)
}

export default function EntranceLiveSessionCard({ boxId, hasConnectedDevice }: EntranceLiveSessionCardProps) {
	const { data, loading, error, reexecuteQuery } = useQuery(ENTRANCE_LIVE_SESSION_QUERY, {
		variables: { boxId: `${boxId}` },
	})
	const [startLiveStream, { loading: startLoading, error: startError }] = useMutation(START_ENTRANCE_LIVE_STREAM_MUTATION)
	const [keepLiveStreamAlive] = useMutation(KEEP_ENTRANCE_LIVE_STREAM_ALIVE_MUTATION)
	const [stopLiveStream, { loading: stopLoading, error: stopError }] = useMutation(STOP_ENTRANCE_LIVE_STREAM_MUTATION)
	const [session, setSession] = useState<LiveSession | null>(null)
	const [terminalStatus, setTerminalStatus] = useState<LiveSessionStatus | null>(null)
	const [statusMessage, setStatusMessage] = useState('')
	const stopRequestedRef = useRef(false)
	const hadSessionRef = useRef(false)
	const keepalivePendingRef = useRef(false)

	const queriedSession = data?.entranceLiveStreamSession || null

	useEffect(() => {
		if (queriedSession) {
			hadSessionRef.current = true
			setSession(queriedSession)
			setTerminalStatus(null)
			setStatusMessage(queriedSession.lastErrorMessage || '')
			return
		}

		if (loading || !hadSessionRef.current) {
			return
		}

		// WHY: entranceLiveStreamSession only returns active or in-progress sessions.
		// Once the backend stops exposing a known session, show a user-facing failure state.
		hadSessionRef.current = false
		setSession(null)
		if (stopRequestedRef.current) {
			setTerminalStatus('STOPPED')
			setStatusMessage('')
			return
		}

		setTerminalStatus('FAILED')
		setStatusMessage('The live view ended before the camera image was available. Please try again.')
	}, [loading, queriedSession])

	useEffect(() => {
		if (!session?.id) return

		const intervalId = window.setInterval(() => {
			void reexecuteQuery({ requestPolicy: 'network-only' })
		}, POLL_INTERVAL_MS)

		return () => {
			window.clearInterval(intervalId)
		}
	}, [reexecuteQuery, session?.id])

	useEffect(() => {
		if (!session?.id || !KEEPALIVE_STATUSES.includes(session.status)) return

		const intervalId = window.setInterval(async () => {
			if (keepalivePendingRef.current || stopRequestedRef.current) return
			keepalivePendingRef.current = true

			try {
				const result = await keepLiveStreamAlive({ sessionId: session.id })
				if (result?.error) {
					setTerminalStatus('FAILED')
					setStatusMessage(result.error.message || 'Failed to keep the live view open.')
					return
				}

				const nextSession = result?.data?.keepEntranceLiveStreamAlive
				if (nextSession) {
					hadSessionRef.current = true
					setSession(nextSession)
					setTerminalStatus(null)
				}
			} finally {
				keepalivePendingRef.current = false
			}
		}, KEEPALIVE_INTERVAL_MS)

		return () => {
			window.clearInterval(intervalId)
		}
	}, [keepLiveStreamAlive, session])

	const displayStatus: LiveSessionStatus = terminalStatus || session?.status || 'STOPPED'
	const playbackUrl = session?.relayDetails?.playbackUrl || session?.playbackUrl || ''
	const isSessionOpen = Boolean(session?.id)
	const isBusy = startLoading || stopLoading
	const canStart = !isSessionOpen && !isBusy
	const canStop = isSessionOpen && displayStatus !== 'STOPPING' && !isBusy
	const combinedErrorMessage = error?.message || startError?.message || stopError?.message || statusMessage

	const onRefresh = async () => {
		await reexecuteQuery({ requestPolicy: 'network-only' })
	}

	const onStart = async () => {
		stopRequestedRef.current = false
		setTerminalStatus(null)
		setStatusMessage('')

		const result = await startLiveStream({
			boxId: `${boxId}`,
			qualityProfile: 'inspect',
			recordingMode: 'off',
		})

		if (result?.error) {
			setSession(null)
			setTerminalStatus('FAILED')
			setStatusMessage(result.error.message || 'Failed to start the live view.')
			return
		}

		const nextSession = result?.data?.startEntranceLiveStream
		if (nextSession) {
			hadSessionRef.current = true
			setSession(nextSession)
			setStatusMessage(nextSession.lastErrorMessage || '')
		}

		await reexecuteQuery({ requestPolicy: 'network-only' })
	}

	const onStop = async () => {
		if (!session?.id) return
		stopRequestedRef.current = true
		setSession({
			...session,
			status: 'STOPPING',
		})
		setStatusMessage('')

		const result = await stopLiveStream({ sessionId: session.id })
		if (result?.error || result?.data?.stopEntranceLiveStream === false) {
			stopRequestedRef.current = false
			setSession({
				...session,
				status: session.status,
			})
			setTerminalStatus('FAILED')
			setStatusMessage(result?.error?.message || 'Failed to stop the live view.')
			return
		}

		await reexecuteQuery({ requestPolicy: 'network-only' })
	}

	return (
		<div className={styles.liveSessionCard}>
			<div className={styles.liveSessionHeader}>
				<div>
					<h3><T>Live entrance camera</T></h3>
					<p className={styles.liveSessionIntro}>
						<T>Start a live view to check what is happening at the hive entrance.</T>
					</p>
				</div>
				<LiveStatusBadge status={displayStatus} />
			</div>

			<p className={styles.liveSessionDescription}>
				<LiveStatusDescription status={displayStatus} hasConnectedDevice={hasConnectedDevice} />
			</p>

			{displayStatus === 'ACTIVE' && playbackUrl ? (
				<MjpegLivePreview playbackUrl={playbackUrl} isActive={displayStatus === 'ACTIVE'} />
			) : null}

			<div className={styles.liveSessionActions}>
				<Button color="green" onClick={onStart} loading={startLoading} disabled={!canStart}>
					<T>Start live view</T>
				</Button>
				<Button color="red" onClick={onStop} loading={stopLoading} disabled={!canStop}>
					<T>Stop live view</T>
				</Button>
				<Button color="white" onClick={onRefresh} disabled={loading || isBusy}>
					<T>Refresh</T>
				</Button>
			</div>

			{combinedErrorMessage ? (
				<div className={styles.connectionError}>{combinedErrorMessage}</div>
			) : null}
		</div>
	)
}
