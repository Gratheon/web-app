import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import { getUser } from '@/models/user'
import { formatDateTimeByLocale, resolveLocale } from '@/shared/dateLocale'
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

function formatOptionalDate(value?: string | null, locale?: string | null) {
	if (!value) return ' - '
	return formatDateTimeByLocale(value, { dateStyle: 'medium', timeStyle: 'short' }, locale)
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

	const label = {
		REQUESTED: <T>Requested</T>,
		DEVICE_OFFLINE: <T>Offline</T>,
		STARTING: <T>Starting</T>,
		ACTIVE: <T>Active</T>,
		STOPPING: <T>Stopping</T>,
		STOPPED: <T>Stopped</T>,
		FAILED: <T>Failed</T>,
	}[status]

	return <span className={`${styles.statusBadge} ${className}`}>{label}</span>
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
			return <T>gate-video-stream created the live session and is waiting for the entrance device to pick up the start command.</T>
		case 'DEVICE_OFFLINE':
			return hasConnectedDevice
				? <T>The entrance device has not checked in recently. Keep the session open and it will continue once the device comes back online.</T>
				: <T>No entrance device is linked in the app right now, so this live session will remain offline until a device is connected and checks in.</T>
		case 'STARTING':
			return <T>The entrance device acknowledged the request and gate-video-stream is waiting for the relay to become playable.</T>
		case 'ACTIVE':
			return <T>The live session is active through gate-video-stream. This UI does not rely on any private Jetson URL.</T>
		case 'STOPPING':
			return <T>The stop command was sent. Waiting for gate-video-stream to close the current live session.</T>
		case 'FAILED':
			return <T>The live session failed or disappeared before playback was confirmed. You can try starting a new session.</T>
		case 'STOPPED':
		default:
			return <T>No live session is open right now. Start one when you want to request entrance camera streaming.</T>
	}
}

export default function EntranceLiveSessionCard({ boxId, hasConnectedDevice }: EntranceLiveSessionCardProps) {
	const userStored = useLiveQuery(() => getUser(), [], null)
	const locale = resolveLocale(userStored?.locale, userStored?.lang)
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
		// Once the backend stops exposing a known session, keep a clear terminal MVP state
		// instead of pretending that embedded playback still exists.
		hadSessionRef.current = false
		setSession(null)
		if (stopRequestedRef.current) {
			setTerminalStatus('STOPPED')
			setStatusMessage('')
			return
		}

		setTerminalStatus('FAILED')
		setStatusMessage('The live session is no longer available from gate-video-stream. It may have expired, failed, or been closed by the device.')
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
					setStatusMessage(result.error.message || 'Failed to keep the live session alive.')
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
	const isPlaceholderPlayback = Boolean(session?.relayDetails?.placeholder)
	const isSessionOpen = Boolean(session?.id)
	const isBusy = startLoading || stopLoading
	const canStart = !isSessionOpen && !isBusy
	const canStop = isSessionOpen && displayStatus !== 'STOPPING' && !isBusy
	const combinedErrorMessage = error?.message || startError?.message || stopError?.message || statusMessage

	const sessionMeta = useMemo(() => {
		if (!session && displayStatus === 'STOPPED') return []

		return [
			{ label: 'Quality profile', value: session?.qualityProfile || 'inspect' },
			{ label: 'Recording mode', value: session?.recordingMode || 'off' },
			{ label: 'Relay protocol', value: session?.relayDetails?.relayProtocol || session?.relayProtocol || 'mjpeg' },
			{ label: 'Playback endpoint', value: playbackUrl || 'Not published yet' },
			{ label: 'Session expires', value: formatOptionalDate(session?.expiresAt, locale) },
			{ label: 'Last device seen', value: formatOptionalDate(session?.lastDeviceSeenAt, locale) },
			{ label: 'Last keepalive', value: formatOptionalDate(session?.lastKeepaliveAt, locale) },
			{ label: 'Last error code', value: session?.lastErrorCode || ' - ' },
		]
	}, [displayStatus, locale, playbackUrl, session])

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
			setStatusMessage(result.error.message || 'Failed to start the live session.')
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
			setStatusMessage(result?.error?.message || 'Failed to stop the live session.')
			return
		}

		await reexecuteQuery({ requestPolicy: 'network-only' })
	}

	return (
		<div className={styles.liveSessionCard}>
			<div className={styles.liveSessionHeader}>
				<div>
					<h3><T>Entrance live session</T></h3>
					<p className={styles.liveSessionIntro}>
						<T>This flow uses the federated GraphQL API behind graphql-router and gate-video-stream only. No private Jetson playback URL is required in the browser.</T>
					</p>
				</div>
				<LiveStatusBadge status={displayStatus} />
			</div>

			<p className={styles.liveSessionDescription}>
				<LiveStatusDescription status={displayStatus} hasConnectedDevice={hasConnectedDevice} />
			</p>

			<div className={styles.liveSessionActions}>
				<Button color="green" onClick={onStart} loading={startLoading} disabled={!canStart}>
					<T>Start live session</T>
				</Button>
				<Button color="red" onClick={onStop} loading={stopLoading} disabled={!canStop}>
					<T>Stop live session</T>
				</Button>
				<Button color="white" onClick={onRefresh} disabled={loading || isBusy}>
					<T>Refresh status</T>
				</Button>
			</div>

			{combinedErrorMessage ? (
				<div className={styles.connectionError}>{combinedErrorMessage}</div>
			) : null}

			<div className={styles.liveSessionMetaGrid}>
				{sessionMeta.map((item) => (
					<div key={item.label} className={styles.liveSessionMetaItem}>
						<div className={styles.liveSessionMetaLabel}>{item.label}</div>
						<div className={styles.liveSessionMetaValue}>{item.value}</div>
					</div>
				))}
			</div>

			{displayStatus === 'ACTIVE' ? (
				<div className={styles.liveSessionMvpState}>
					<h4><T>Live playback MVP state</T></h4>
					<p>
						{isPlaceholderPlayback ? (
							<T>gate-video-stream reports a placeholder relay for this session. The live session is active, but the web-app intentionally shows a clear MVP state instead of pretending that full in-browser video already exists.</T>
						) : (
							<T>The relay session is active and published by gate-video-stream, but embedded browser playback is still intentionally limited in this MVP. Use the status information here as the source of truth instead of expecting a production-ready player yet.</T>
						)}
					</p>
					{playbackUrl ? (
						<p className={styles.liveSessionUrlWrap}>
							<strong><T>Relay URL:</T></strong>{' '}
							<a href={playbackUrl} target="_blank" rel="noreferrer">{playbackUrl}</a>
						</p>
					) : null}
				</div>
			) : null}
		</div>
	)
}
