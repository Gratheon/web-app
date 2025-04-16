import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery, useSubscription } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'

import { Frame as FrameType, getFrames, moveFrame } from '@/models/frames'
import { enrichFramesWithSides } from '@/models/frameSide'
import { enrichFramesWithSideFiles } from '@/models/frameSideFile'
import {
	enrichFramesWithSideCells,
	getFrameSideCells,
	newFrameSideCells,
	updateFrameSideCells,
} from '@/models/frameSideCells'

import styles from './index.module.less'
import Frame from './boxFrame'
import FRAMES_QUERY from './framesQuery.graphql.ts'

type BoxType = {
	box: any
	boxId: number
	frameId: number
	frameSideId: number
	apiaryId: number
	hiveId: number
	editable?: boolean
	selected?: boolean
	displayMode: string
	// Add new props
	frameSidesData?: any[] // Make optional for cases where it's not passed
	onFrameImageClick?: (imageUrl: string) => void // Make optional
}

export default function Box({
	box,
	boxId,
	frameId,
	frameSideId,
	apiaryId,
	hiveId,
	editable = true,
	selected = false,
	displayMode,
	// Destructure new props with defaults
	frameSidesData = [],
	onFrameImageClick = (imageUrl: string) => {},
}: BoxType): any {
	const navigate = useNavigate()
	let framesDiv = []

	useSubscription(
		gql`
			subscription onHiveFrameSideCellsDetected($hiveId: String) {
				onHiveFrameSideCellsDetected(hiveId: $hiveId) {
					delta
					isCellsDetectionComplete

					frameSideId
					broodPercent
					cappedBroodPercent
					eggsPercent
					pollenPercent
					honeyPercent
				}
			}
		`,
		{ hiveId },
		async (_, response) => {
			if (response) {
				let updatedFrameSideId =
					+response.onHiveFrameSideCellsDetected.frameSideId
				let frameSideFile =
					(await getFrameSideCells(updatedFrameSideId)) ||
					newFrameSideCells(updatedFrameSideId, hiveId)

				frameSideFile.broodPercent =
					response.onHiveFrameSideCellsDetected.broodPercent
				frameSideFile.cappedBroodPercent =
					response.onHiveFrameSideCellsDetected.cappedBroodPercent
				frameSideFile.eggsPercent =
					response.onHiveFrameSideCellsDetected.eggsPercent
				frameSideFile.pollenPercent =
					response.onHiveFrameSideCellsDetected.pollenPercent
				frameSideFile.honeyPercent =
					response.onHiveFrameSideCellsDetected.honeyPercent

				await updateFrameSideCells(frameSideFile)
			}
		}
	)

	const frames = useLiveQuery(
		async () => {
			const framesWithoutSides = await getFrames({ boxId: box.id })
			if (!framesWithoutSides) return null;
			const framesWithoutCells = await enrichFramesWithSides(framesWithoutSides)
			if (!framesWithoutCells) return null;
			const framesWithoutFiles = await enrichFramesWithSideCells(framesWithoutCells)
			if (!framesWithoutFiles) return null;
			return await enrichFramesWithSideFiles(framesWithoutFiles)
		},
		[box.id],
		false
	)

	if (frames === false) {
		return <Loader />
	}

	const [updateFramesRemote, { error }] = useMutation(
		gql`
			mutation updateFrames($frames: [FrameInput]!) {
				updateFrames(frames: $frames) {
					id
				}
			}
		`
	)
	let { loading } = useQuery(FRAMES_QUERY, {
		variables: {
			id: +hiveId,
			apiaryId: +apiaryId,
		},
	})

	if (loading) {
		return <Loader />
	}

	// Calculate adjacent bee counts and max count
	const adjacentBeeCounts: number[] = [];
	let maxAdjacentBeeCount = 0;
	if (frames && frames.length > 1) {
		for (let i = 0; i < frames.length - 1; i++) {
			const rightSideBees = (frames[i].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[i].rightSide?.frameSideFile?.detectedDroneCount || 0);
			const leftSideBees = (frames[i + 1].leftSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[i + 1].leftSide?.frameSideFile?.detectedDroneCount || 0);
			const totalAdjacentBees = rightSideBees + leftSideBees;
			adjacentBeeCounts.push(totalAdjacentBees);
			if (totalAdjacentBees > maxAdjacentBeeCount) {
				maxAdjacentBeeCount = totalAdjacentBees;
			}
		}
	}

	if (frames && frames.length > 0) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			let frameDiv = (
				<Frame
					box={box}
					frameId={frameId}
					frameSideId={frameSideId}
					hiveId={hiveId}
					apiaryId={apiaryId}
					frame={frame}
					editable={editable}
					displayMode={displayMode}
					// Pass props down to Frame
					frameSidesData={frameSidesData}
					onFrameImageClick={onFrameImageClick}
				/>
			)

			if (editable && displayMode == 'list') {
				framesDiv.push(
					</* @ts-ignore */ Draggable key={i}>{frameDiv}</Draggable>
				)
			} else {
				framesDiv.push(frameDiv)
			}
		}
	}

	let framesWrapped: any = framesDiv

	if (editable) {
		async function swapFrames({ removedIndex, addedIndex }) {
			await moveFrame({
				boxId,
				addedIndex,
				removedIndex,
			})

			const frames = await getFrames({ boxId: +boxId })
			await updateFramesRemote({
				frames: frames.map((v: FrameType) => {
					let r = {
						...v,
					}
					delete r.rightId
					delete r.leftId
					delete r.leftSide
					delete r.rightSide
					delete r.__typename
					return r
				}),
			})

			if (!isNil(frameSideId)) {
				navigate(
					`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frameId}/${frameSideId}`,
					{ replace: true }
				)
			}
		}

		framesWrapped = (
			<>
				{/* @ts-ignore */}
				<Container
					style={{ height: `calc(100% - 10px)` }}
					onDrop={swapFrames}
					orientation="horizontal"
				>
					{framesDiv}
				</Container>
			</>
		)
	}

	// visually limit the width of the box to 12 frames
	let maxWidthStyle ={}
	if(frames.length> 10){
		maxWidthStyle = {
			maxWidth: 32 * 12 + 10
		}
	}


	if (displayMode == 'visual') {
		return (
			<>
				<ErrorMessage error={error} />
				<div 
					className={`${styles.boxOuter} ${selected && styles.selected}`}
					style={maxWidthStyle}>
					<div className={styles.boxInnerVisual}>
						{!frames && <Loader size={1} />}
						{framesDiv}
					</div>
					{/* New Indicator Layer */}
					<div className={styles.indicatorLayer}>
						{/* Render Indicator Lines */}
						{adjacentBeeCounts.map((count, index) => {
							if (count <= 0) return null;
							const indicatorHeightPercent = maxAdjacentBeeCount > 0 ? Math.min(100, (count / maxAdjacentBeeCount) * 100) : 0;
							const visualFrameTotalWidth = 116; // 100 width + 4 padding + 12 margin
							const leftPosition = (index + 1) * visualFrameTotalWidth + 1; // Center + 3px shift

							return (
								<div
									key={`indicator-line-${index}`}
									className={styles.betweenFrameIndicator}
									style={{ left: `${leftPosition}px` }}
								>
									<div
										className={styles.indicatorLine}
										style={{ height: `${indicatorHeightPercent}%` }}
									/>
								</div>
							);
						})}
					</div>
					{/* Render Indicator Counts (Moved outside indicatorLayer AND boxInnerVisual for z-index) */}
					{adjacentBeeCounts.map((count, index) => {
						if (count <= 0) return null;
						const visualFrameTotalWidth = 116;
						const leftPosition = (index + 1) * visualFrameTotalWidth + 1; // Center + 3px shift

						// Position count directly within the boxOuter
							return (
								<div
									key={`indicator-count-${index}`}
									className={styles.indicatorCount}
									style={{ left: `${leftPosition}px` }} // Use calculated center; transform handles centering
								>
									{count}
								</div>
						);
					})}
				</div>
			</>
		)
	}

	return (
		<>
			<ErrorMessage error={error} />
			<div
				className={`${styles['boxType_' + box.type]} ${styles.boxOuter} ${
					selected && styles.selected
				}`}
				style={maxWidthStyle}
			>
				<div className={styles.boxInner}>
					{!frames && <Loader size={1} />}
					{framesWrapped}
				</div>
				{/* New Indicator Layer for non-visual modes */}
				<div className={styles.indicatorLayer}>
					{/* Render Indicator Lines */}
					{adjacentBeeCounts.map((count, index) => {
						if (count <= 0) return null;
						const indicatorHeightPercent = maxAdjacentBeeCount > 0 ? Math.min(100, (count / maxAdjacentBeeCount) * 100) : 0;
						const listFrameTotalWidth = 38;
						const leftPosition = (index + 1) * listFrameTotalWidth + 3;

						return (
							<div
								key={`indicator-line-${index}`}
								className={styles.betweenFrameIndicator}
								style={{ left: `${leftPosition}px` }}
							>
								<div
									className={styles.indicatorLine}
									style={{ height: `${indicatorHeightPercent}%` }}
								/>
							</div>
						);
					})}

				</div>
			</div>
		</>
	)
}
