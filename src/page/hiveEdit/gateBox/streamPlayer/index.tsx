import Hls from 'hls.js'
import React, { useEffect, RefObject } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { formatDateTimeByLocale, resolveLocale } from '@/shared/dateLocale'
import { getUser } from '../../../../models/user.ts'

import styles from './style.module.less'

type VideoStream = {
	id?: string | number
	maxSegment?: number
	playlistURL?: string
	startTime?: string | number | Date
	endTime?: string | number | Date
}

type NormalizedStream = VideoStream & {
	key: string
	start: Date
	end: Date
	videoDurationSeconds: number
}

type DayGroup = {
	key: string
	date: Date
	streams: NormalizedStream[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const SEGMENT_SECONDS = 10
const FALLBACK_DURATION_SECONDS = 10

function ReactHlsPlayer({
	hlsConfig,
	playerRef = React.createRef<HTMLVideoElement>(),
	src,
	autoPlay = true,
	...props
}: {
	hlsConfig?: Record<string, unknown>
	playerRef?: RefObject<HTMLVideoElement>
	src: string
	autoPlay?: boolean
	[key: string]: any
}) {
	useEffect(() => {
		let hls: Hls

		function _initPlayer() {
			if (hls != null) {
				hls.destroy()
			}

			const newHls = new Hls({
				enableWorker: false,
				...hlsConfig,
			})

			if (playerRef.current != null) {
				newHls.attachMedia(playerRef.current)
			}

			newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
				newHls.loadSource(src)

				newHls.on(Hls.Events.MANIFEST_PARSED, () => {
					if (autoPlay) {
						playerRef?.current
							?.play()
							.catch(() =>
								console.log(
									'Unable to autoplay prior to user interaction with the dom.'
								)
							)
					}
				})
			})

			newHls.on(Hls.Events.ERROR, function (event, data) {
				if (data.fatal) {
					console.error(data)
				}
			})

			hls = newHls
		}

		if (Hls.isSupported()) {
			_initPlayer()
		}

		return () => {
			if (hls != null) {
				hls.destroy()
			}
		}
	}, [autoPlay, hlsConfig, playerRef, src])

	if (Hls.isSupported()) return <video ref={playerRef} {...props} />

	return <video ref={playerRef} src={src} autoPlay={autoPlay} {...props} />
}

function getValidDate(value?: string | number | Date): Date | null {
	if (!value) return null

	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null

	return date
}
function getVideoDurationSeconds(stream: VideoStream) {
	const durationFromSegments = Number(stream.maxSegment || 0) * SEGMENT_SECONDS
	if (durationFromSegments > 0) return durationFromSegments

	const start = getValidDate(stream.startTime)
	const end = getValidDate(stream.endTime)
	if (start && end && end.getTime() > start.getTime()) {
		return Math.round((end.getTime() - start.getTime()) / 1000)
	}

	return FALLBACK_DURATION_SECONDS
}

function getDisplayEnd(
	stream: VideoStream,
	start: Date,
	videoDurationSeconds: number
) {
	const end = getValidDate(stream.endTime)

	// WHY: the API can return Unix epoch for an unfinished/malformed stream, which rendered as 1970.
	// Use segment duration as a safe visual fallback while keeping valid wall-clock ranges on the timeline.
	if (end && end.getTime() > start.getTime()) return end

	return new Date(start.getTime() + videoDurationSeconds * 1000)
}

function normalizeStreams(videoStreams: VideoStream[]): NormalizedStream[] {
	return (videoStreams || [])
		.map((stream, index) => {
			const start = getValidDate(stream.startTime)
			if (!start || !stream.playlistURL) return null

			const videoDurationSeconds = getVideoDurationSeconds(stream)
			const end = getDisplayEnd(stream, start, videoDurationSeconds)

			return {
				...stream,
				key: `${stream.id || index}-${start.getTime()}`,
				start,
				end,
				videoDurationSeconds,
			}
		})
		.filter(Boolean)
		.sort((a, b) => b.start.getTime() - a.start.getTime()) as NormalizedStream[]
}

function getDayStart(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDayKey(date: Date) {
	const day = getDayStart(date)
	return `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
}

function groupStreamsByDay(streams: NormalizedStream[]): DayGroup[] {
	const groups = streams.reduce<Record<string, DayGroup>>((acc, stream) => {
		let day = getDayStart(stream.start)
		const lastDay = getDayStart(stream.end)

		// WHY: long camera sessions can cross midnight. Add the same recording to each affected day
		// so the horizontal timeline shows the covered range on both days.
		while (day.getTime() <= lastDay.getTime()) {
			const key = getDayKey(day)

			if (!acc[key]) {
				acc[key] = {
					key,
					date: new Date(day),
					streams: [],
				}
			}

			acc[key].streams.push(stream)
			day = new Date(day.getTime() + DAY_MS)
		}

		return acc
	}, {})

	return Object.values(groups).sort(
		(a, b) => b.date.getTime() - a.date.getTime()
	)
}

function formatDuration(seconds: number) {
	if (seconds < 60) return `${seconds} sec`

	const minutes = Math.floor(seconds / 60)
	const restSeconds = seconds % 60
	if (minutes < 60)
		return restSeconds ? `${minutes} min ${restSeconds} sec` : `${minutes} min`

	const hours = Math.floor(minutes / 60)
	const restMinutes = minutes % 60
	return restMinutes ? `${hours} h ${restMinutes} min` : `${hours} h`
}

function getStreamLabel(stream: NormalizedStream, locale: string) {
	return `${formatDateTimeByLocale(
		stream.start,
		{ dateStyle: 'medium', timeStyle: 'short' },
		locale
	)} - ${formatDateTimeByLocale(
		stream.end,
		{ dateStyle: 'medium', timeStyle: 'short' },
		locale
	)} (${formatDuration(stream.videoDurationSeconds)})`
}

function getTimeLabel(date: Date, locale: string) {
	return formatDateTimeByLocale(date, { timeStyle: 'short' }, locale)
}

export default function StreamPlayer({
	videoStreams,
}: {
	videoStreams: VideoStream[]
}) {
	const userStored = useLiveQuery(() => getUser(), [], null)
	const locale = resolveLocale(userStored?.locale, userStored?.lang)
	const streams = React.useMemo(
		() => normalizeStreams(videoStreams),
		[videoStreams]
	)
	const dayGroups = React.useMemo(() => groupStreamsByDay(streams), [streams])
	const [selectedStreamKey, selectStream] = React.useState<string | null>(null)

	useEffect(() => {
		if (!streams.length) {
			selectStream(null)
			return
		}

		if (
			!selectedStreamKey ||
			!streams.some((stream) => stream.key === selectedStreamKey)
		) {
			selectStream(streams[0].key)
		}
	}, [selectedStreamKey, streams])

	const selectedStream =
		streams.find((stream) => stream.key === selectedStreamKey) || streams[0]
	const playlistURL = selectedStream?.playlistURL

	if (!streams.length || !playlistURL) return null

	return (
		<div className={styles.streamPlayer}>
			<div className={styles.timelinePanel}>
				<div className={styles.timelineIntro}>
					<strong>Recorded video timeline</strong>
					<span>
						Click a segment to play that recording. Tiny segments are also
						available in the list below.
					</span>
				</div>

				{dayGroups.map((group) => {
					const dayStart = group.date.getTime()
					const dayEnd = dayStart + DAY_MS
					const totalRecordedSeconds = group.streams.reduce(
						(total, stream) => total + stream.videoDurationSeconds,
						0
					)

					return (
						<section className={styles.dayTimeline} key={group.key}>
							<div className={styles.dayHeader}>
								<strong>
									{formatDateTimeByLocale(
										group.date,
										{ dateStyle: 'full' },
										locale
									)}
								</strong>
								<span>
									{group.streams.length} recordings,{' '}
									{formatDuration(totalRecordedSeconds)} recorded
								</span>
							</div>

							<div className={styles.timeLabels} aria-hidden="true">
								<span>00:00</span>
								<span>06:00</span>
								<span>12:00</span>
								<span>18:00</span>
								<span>24:00</span>
							</div>

							<div
								className={styles.timelineTrack}
								aria-label={`Recordings on ${formatDateTimeByLocale(
									group.date,
									{ dateStyle: 'full' },
									locale
								)}`}
							>
								{group.streams.map((stream) => {
									const clippedStart = Math.max(
										stream.start.getTime(),
										dayStart
									)
									const clippedEnd = Math.min(stream.end.getTime(), dayEnd)
									const left = ((clippedStart - dayStart) / DAY_MS) * 100
									const width = Math.max(
										((clippedEnd - clippedStart) / DAY_MS) * 100,
										0.25
									)
									const label = getStreamLabel(stream, locale)
									const isSelected = selectedStream.key === stream.key

									return (
										<button
											key={stream.key}
											type="button"
											className={`${styles.timelineSegment} ${
												isSelected ? styles.timelineSegmentSelected : ''
											}`}
											style={{ left: `${left}%`, width: `${width}%` }}
											onClick={() => selectStream(stream.key)}
											aria-label={label}
											title={label}
										>
											<span>
												{getTimeLabel(new Date(clippedStart), locale)}
											</span>
										</button>
									)
								})}
							</div>
						</section>
					)
				})}

				<details className={styles.streamListDetails}>
					<summary>Show recording list</summary>
					<div className={styles.streamList}>
						{streams.map((stream) => {
							const label = getStreamLabel(stream, locale)
							const isSelected = selectedStream.key === stream.key

							return (
								<button
									key={stream.key}
									type="button"
									onClick={() => selectStream(stream.key)}
									className={`${styles.streamListItem} ${
										isSelected ? styles.streamListItemSelected : ''
									}`}
								>
									{label}
								</button>
							)
						})}
					</div>
				</details>
			</div>

			<div className={styles.selectedStreamMeta}>
				<strong>Now playing:</strong> {getStreamLabel(selectedStream, locale)}
			</div>

			<ReactHlsPlayer
				src={playlistURL}
				autoPlay={false}
				controls={true}
				className={styles.videoPlayer}
			/>
		</div>
	)
}
