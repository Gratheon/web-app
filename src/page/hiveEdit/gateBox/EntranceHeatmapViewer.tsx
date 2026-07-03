import React from 'react'

import { gql, useQuery } from '@/api'
import T from '@/shared/translate'
import Button from '@/shared/button'

import styles from './styles.module.less'

const ENTRANCE_HEATMAPS_QUERY = gql`
query entranceHeatmaps($boxIds: [ID]!, $date: String, $limit: Int) {
	entranceHeatmaps(boxIds: $boxIds, date: $date, limit: $limit) {
		id
		boxId
		date
		imageURL
		width
		height
		trajectoryCount
		pointCount
		lastSampleAt
		updatedAt
	}
}
`

type EntranceHeatmap = {
	id: string
	date: string
	imageURL?: string | null
	width?: number | null
	height?: number | null
	trajectoryCount?: number | null
	pointCount?: number | null
	lastSampleAt?: string | null
	updatedAt?: string | null
}

type Props = {
	boxId?: string | number | null
}

function formatDateLabel(date: string) {
	const parsed = new Date(`${date}T00:00:00`)
	if (Number.isNaN(parsed.getTime())) return date
	return parsed.toLocaleDateString(undefined, {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

function shiftDate(date: string, days: number) {
	const parsed = new Date(`${date}T00:00:00`)
	if (Number.isNaN(parsed.getTime())) return date
	parsed.setDate(parsed.getDate() + days)
	return parsed.toISOString().slice(0, 10)
}

function todayDate() {
	return new Date().toISOString().slice(0, 10)
}

function HeatmapContent({ boxId }: { boxId: string | number }) {
	const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
	const [hasManualDate, setHasManualDate] = React.useState(false)
	const boxIds = React.useMemo(() => [+boxId], [boxId])
	const { loading, error, data } = useQuery(ENTRANCE_HEATMAPS_QUERY, {
		variables: {
			boxIds,
			date: selectedDate,
			limit: selectedDate ? 1 : 1,
		},
	})
	const heatmap = (data?.entranceHeatmaps || [])[0] as EntranceHeatmap | undefined

	React.useEffect(() => {
		// WHY: when user opens the tab, no date filter asks the API for the latest
		// available heatmap. Once it arrives, pin navigation to that day.
		if (!selectedDate && heatmap?.date) {
			setSelectedDate(heatmap.date)
		}
	}, [heatmap?.date, selectedDate])

	const shownDate = selectedDate || heatmap?.date || todayDate()
	const isToday = shownDate >= todayDate()

	return (
		<div className={styles.heatmapPanel}>
			<div className={styles.heatmapHeader}>
				<div>
					<strong><T>Landing board heatmap</T></strong>
					<p>
						<T>Daily bee trajectory density generated from Entrance Observer tracking data.</T>
					</p>
				</div>
				<div className={styles.heatmapDateControls}>
					<Button type="button" color="transparent" onClick={() => {
						setHasManualDate(true)
						setSelectedDate(shiftDate(shownDate, -1))
					}}>
						<T>Previous day</T>
					</Button>
					<span className={styles.heatmapDate}>{formatDateLabel(shownDate)}</span>
					{!isToday ? (
						<Button type="button" color="transparent" onClick={() => {
							setHasManualDate(true)
							setSelectedDate(shiftDate(shownDate, 1))
						}}>
							<T>Next day</T>
						</Button>
					) : null}
					<Button type="button" color="transparent" onClick={() => {
						setHasManualDate(false)
						setSelectedDate(null)
					}}>
						<T>Latest</T>
					</Button>
				</div>
			</div>

			{loading ? <p className={styles.heatmapState}><T>Loading heatmap...</T></p> : null}
			{error ? <p className={styles.connectionError}>{error.message}</p> : null}
			{!loading && !error && !heatmap ? (
				<p className={styles.heatmapState}>
					{hasManualDate ? (
						<T>No heatmap was generated for this day yet.</T>
					) : (
						<T>No heatmaps are available yet. They appear after Entrance Observer uploads tracked bee trajectories.</T>
					)}
				</p>
			) : null}
			{heatmap?.imageURL ? (
				<figure className={styles.heatmapFigure}>
					<img src={heatmap.imageURL} alt={`Entrance Observer heatmap for ${heatmap.date}`} />
					<figcaption>
						{heatmap.pointCount || 0} <T>trajectory points</T> · {heatmap.trajectoryCount || 0} <T>tracks</T>
					</figcaption>
				</figure>
			) : null}
		</div>
	)
}

export default function EntranceHeatmapViewer(props: Props) {
	if (!props.boxId) return null
	return <HeatmapContent boxId={props.boxId} />
}
