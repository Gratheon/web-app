import React from 'react'

import { gql, useQuery } from '@/api'
import T from '@/shared/translate'
import StreamPlayer from '@/page/hiveEdit/gateBox/streamPlayer'

import styles from './styles.module.less'

const DEVICE_STREAMS_QUERY = gql`
query deviceStreams($boxIds: [ID]!) {
	videoStreams(boxIds: $boxIds) {
		id
		maxSegment
		playlistURL
		startTime
		endTime
		active
	}
}
`

type DeviceStreamPlaybackProps = {
	boxId?: string | number | null
	className?: string
	emptyMessage?: React.ReactNode
	title?: React.ReactNode
}

function DeviceStreamPlaybackContent({
	boxId,
	className = '',
	emptyMessage,
	title,
}: Required<Pick<DeviceStreamPlaybackProps, 'boxId'>> & Omit<DeviceStreamPlaybackProps, 'boxId'>) {
	const boxIds = React.useMemo(() => [+boxId], [boxId])
	const { loading, error, data } = useQuery(DEVICE_STREAMS_QUERY, {
		variables: { boxIds },
	})
	const videoStreams = data?.videoStreams || []

	return (
		<div className={`${styles.playback} ${className}`.trim()}>
			{title ? <h3>{title}</h3> : null}
			{loading ? <p className={styles.state}><T>Loading video stream...</T></p> : null}
			{error ? <p className={styles.error}>{error.message}</p> : null}
			{!loading && !error && videoStreams.length === 0 ? (
				<p className={styles.state}>
					{emptyMessage || <T>No video recordings are available yet.</T>}
				</p>
			) : null}
			<StreamPlayer videoStreams={videoStreams} />
		</div>
	)
}

export default function DeviceStreamPlayback(props: DeviceStreamPlaybackProps) {
	// WHY: the project's useQuery adapter has no pause option, so keep the query hook
	// in a child component that only mounts after a linked box exists.
	if (!props.boxId) return null

	return <DeviceStreamPlaybackContent {...props} boxId={props.boxId} />
}
