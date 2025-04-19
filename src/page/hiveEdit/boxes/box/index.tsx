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

	// Calculate edge and adjacent bee counts and overall max count
	let firstFrameLeftBees = 0;
	let lastFrameRightBees = 0;
	const adjacentBeeCounts: number[] = [];
	let maxBeeCount = 0; // Renamed from maxAdjacentBeeCount and includes edges

	if (frames && frames.length > 0) {
		// Calculate left edge count
		firstFrameLeftBees = (frames[0].leftSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[0].leftSide?.frameSideFile?.detectedDroneCount || 0);
		maxBeeCount = Math.max(maxBeeCount, firstFrameLeftBees);

		// Calculate adjacent counts
		if (frames.length > 1) {
			for (let i = 0; i < frames.length - 1; i++) {
				const rightSideBees = (frames[i].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[i].rightSide?.frameSideFile?.detectedDroneCount || 0);
				const leftSideBees = (frames[i + 1].leftSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[i + 1].leftSide?.frameSideFile?.detectedDroneCount || 0);
				const totalAdjacentBees = rightSideBees + leftSideBees;
				adjacentBeeCounts.push(totalAdjacentBees);
				maxBeeCount = Math.max(maxBeeCount, totalAdjacentBees);
			}

			// Calculate right edge count (only if more than one frame)
			const lastFrameIndex = frames.length - 1;
			lastFrameRightBees = (frames[lastFrameIndex].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[lastFrameIndex].rightSide?.frameSideFile?.detectedDroneCount || 0);
			maxBeeCount = Math.max(maxBeeCount, lastFrameRightBees);
		} else {
			// If only one frame, the right edge is the same as the left edge calculation's frame
			lastFrameRightBees = (frames[0].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[0].rightSide?.frameSideFile?.detectedDroneCount || 0);
			maxBeeCount = Math.max(maxBeeCount, lastFrameRightBees);
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
					style={{ height: `100%` }}
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
						{/* Render First Frame Left Indicator */}
						{firstFrameLeftBees > 0 && (
							<div
								key="indicator-line-left-edge"
								className={styles.betweenFrameIndicator}
								style={{ left: '1px' }} // Position before the first frame
							>
								<div
									className={styles.indicatorLine}
									style={{ height: `${maxBeeCount > 0 ? Math.min(100, (firstFrameLeftBees / maxBeeCount) * 100) : 0}%` }}
								/>
							</div>
						)}
						{/* Render Between-Frame Indicator Lines */}
						{adjacentBeeCounts.map((count, index) => {
							if (count <= 0) return null;
							// Use maxBeeCount for scaling
							const indicatorHeightPercent = maxBeeCount > 0 ? Math.min(100, (count / maxBeeCount) * 100) : 0;
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
						{/* Render Last Frame Right Indicator */}
						{lastFrameRightBees > 0 && frames && frames.length > 0 && (
							<div
								key="indicator-line-right-edge"
								className={styles.betweenFrameIndicator}
								// Position after the last frame
								style={{ left: `${frames.length * 116 + 1}px` }}
							>
								<div
									className={styles.indicatorLine}
									style={{ height: `${maxBeeCount > 0 ? Math.min(100, (lastFrameRightBees / maxBeeCount) * 100) : 0}%` }}
								/>
							</div>
						)}
					</div>
					{/* Render Indicator Counts (Moved outside indicatorLayer AND boxInnerVisual for z-index) */}
					{/* Render First Frame Left Count */}
					{firstFrameLeftBees > 0 && (
						<div
							key="indicator-count-left-edge"
							className={styles.indicatorCount}
							style={{ left: '1px' }} // Use calculated center; transform handles centering
						>
							{firstFrameLeftBees}
						</div>
					)}
					{/* Render Between-Frame Counts */}
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
					{/* Render Last Frame Right Count */}
					{lastFrameRightBees > 0 && frames && frames.length > 0 && (
						<div
							key="indicator-count-right-edge"
							className={styles.indicatorCount}
							style={{ left: `${frames.length * 116 + 1}px` }} // Use calculated center; transform handles centering
						>
							{lastFrameRightBees}
						</div>
					)}
				</div>
			</>
		)
	}

	// --- Non-Visual Mode ---
	// Calculate edge counts and max count for non-visual mode
	let firstFrameLeftBeesList = 0;
	let lastFrameRightBeesList = 0;
	const adjacentBeeCountsList: number[] = [];
	let maxBeeCountList = 0;

	if (frames && frames.length > 0) {
		firstFrameLeftBeesList = (frames[0].leftSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[0].leftSide?.frameSideFile?.detectedDroneCount || 0);
		maxBeeCountList = Math.max(maxBeeCountList, firstFrameLeftBeesList);

		if (frames.length > 1) {
			for (let i = 0; i < frames.length - 1; i++) {
				const rightSideBees = (frames[i].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[i].rightSide?.frameSideFile?.detectedDroneCount || 0);
				const leftSideBees = (frames[i + 1].leftSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[i + 1].leftSide?.frameSideFile?.detectedDroneCount || 0);
				const totalAdjacentBees = rightSideBees + leftSideBees;
				adjacentBeeCountsList.push(totalAdjacentBees);
				maxBeeCountList = Math.max(maxBeeCountList, totalAdjacentBees);
			}
			const lastFrameIndex = frames.length - 1;
			lastFrameRightBeesList = (frames[lastFrameIndex].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[lastFrameIndex].rightSide?.frameSideFile?.detectedDroneCount || 0);
			maxBeeCountList = Math.max(maxBeeCountList, lastFrameRightBeesList);
		} else {
			lastFrameRightBeesList = (frames[0].rightSide?.frameSideFile?.detectedWorkerBeeCount || 0) + (frames[0].rightSide?.frameSideFile?.detectedDroneCount || 0);
			maxBeeCountList = Math.max(maxBeeCountList, lastFrameRightBeesList);
		}
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
					{/* Render First Frame Left Indicator (List Mode) */}
					{firstFrameLeftBeesList > 0 && (
						<div
							key="indicator-line-left-edge-list"
							className={styles.betweenFrameIndicator}
							style={{ left: '3px' }} // Adjust position for list mode
						>
							<div
								className={styles.indicatorLine}
								style={{ height: `${maxBeeCountList > 0 ? Math.min(100, (firstFrameLeftBeesList / maxBeeCountList) * 100) : 0}%` }}
							/>
						</div>
					)}
					{/* Render Between-Frame Indicator Lines (List Mode) */}
					{adjacentBeeCountsList.map((count, index) => {
						if (count <= 0) return null;
						// Use maxBeeCountList for scaling
						const indicatorHeightPercent = maxBeeCountList > 0 ? Math.min(100, (count / maxBeeCountList) * 100) : 0;
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
					{/* Render Last Frame Right Indicator (List Mode) */}
					{lastFrameRightBeesList > 0 && frames && frames.length > 0 && (
						<div
							key="indicator-line-right-edge-list"
							className={styles.betweenFrameIndicator}
							// Position after the last frame in list mode
							style={{ left: `${frames.length * 38 + 3}px` }}
						>
							<div
								className={styles.indicatorLine}
								style={{ height: `${maxBeeCountList > 0 ? Math.min(100, (lastFrameRightBeesList / maxBeeCountList) * 100) : 0}%` }}
							/>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
