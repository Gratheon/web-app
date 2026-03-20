import isNil from 'lodash/isNil'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery, useSubscription } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'
import { useTranslation as t } from '@/shared/translate'

import {
	Frame as FrameType,
	getFrames,
	moveFrame,
	moveFrameBetweenBoxes,
} from '@/models/frames'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'
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

let activeFrameDragPayload: any = null

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
	const tFrameRearranged = t('Frame rearranged')
	const navigate = useNavigate()
	const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null)
	let framesDiv = []
	const frameDragPayloadMime = 'application/gratheon-frame-dnd'

	useSubscription(
		gql`
			subscription onHiveFrameSideCellsDetected($hiveId: String) {
				onHiveFrameSideCellsDetected(hiveId: $hiveId) {
					delta
					isCellsDetectionComplete

					frameSideId
					broodPercent
					droneBroodPercent
					cappedBroodPercent
					eggsPercent
					nectarPercent
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
				frameSideFile.droneBroodPercent =
					response.onHiveFrameSideCellsDetected.droneBroodPercent
				frameSideFile.cappedBroodPercent =
					response.onHiveFrameSideCellsDetected.cappedBroodPercent
				frameSideFile.eggsPercent =
					response.onHiveFrameSideCellsDetected.eggsPercent
				frameSideFile.nectarPercent =
					response.onHiveFrameSideCellsDetected.nectarPercent
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


	let framesWrapped: any = framesDiv
	let onNativeDragStart = (event: React.DragEvent<HTMLDivElement>, payload: any) => {}
	let onNativeDragEnd = () => {}
	let onNativeDragOver = (event: React.DragEvent<HTMLDivElement>) => {}
	let onNativeDropAtIndex = async (
		event: React.DragEvent<HTMLDivElement>,
		targetIndex: number
	) => {}
	let onNativeDropAtEnd = async (event: React.DragEvent<HTMLDivElement>) => {}
	let boxInnerDragProps: any = {}

	if (editable) {
		async function updateFramesForBoxes(boxIds: number[]) {
			const distinctBoxIds = [...new Set(boxIds)]
			const framesByBox = await Promise.all(
				distinctBoxIds.map((id) => getFrames({ boxId: +id }))
			)
			const frames = framesByBox
				.flat()
				.filter(Boolean)
				.map((v: FrameType) => {
					let r = {
						...v,
					}
					delete r.rightId
					delete r.leftId
					delete r.leftSide
					delete r.rightSide
					delete r.__typename
					return r
				})

			await updateFramesRemote({ frames })
		}

		async function applyFrameMove({
			sourceBoxId,
			sourceBoxType,
			sourceIndex,
			targetBoxId,
			targetIndex,
		}: {
			sourceBoxId: number
			sourceBoxType: string
			sourceIndex: number
			targetBoxId: number
			targetIndex: number
		}) {
			if (sourceBoxType !== box.type) {
				return
			}

			if (sourceBoxId === targetBoxId) {
				if (sourceIndex === targetIndex) {
					return
				}

				await moveFrame({
					boxId: +targetBoxId,
					addedIndex: targetIndex,
					removedIndex: sourceIndex,
				})
				await updateFramesForBoxes([targetBoxId])
			} else {
				await moveFrameBetweenBoxes({
					fromBoxId: +sourceBoxId,
					toBoxId: +targetBoxId,
					removedIndex: sourceIndex,
					addedIndex: targetIndex,
				})
				await updateFramesForBoxes([sourceBoxId, targetBoxId])
			}

			await addHiveLog({
				hiveId: +hiveId,
				action: hiveLogActions.STRUCTURE_MOVE,
				title: tFrameRearranged,
				details:
					sourceBoxId === targetBoxId
						? `Frame position changed in section #${targetBoxId}.`
						: `Frame moved from section #${sourceBoxId} to section #${targetBoxId}.`,
			})

			if (sourceBoxId === targetBoxId && !isNil(frameSideId)) {
				navigate(
					`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frameId}/${frameSideId}`,
					{ replace: true }
				)
			}
		}

		onNativeDragStart = (event, payload) => {
			console.warn('[hive-dnd] dragstart', {
				sourceBoxId: payload?.boxId,
				sourceBoxType: payload?.boxType,
				sourceIndex: payload?.index,
				frameId: payload?.frameId,
			})
			event.stopPropagation()
			event.dataTransfer.effectAllowed = 'move'
			const raw = JSON.stringify(payload)
			event.dataTransfer.setData(frameDragPayloadMime, raw)
			event.dataTransfer.setData('text/plain', raw)

			activeFrameDragPayload = payload
		}

		onNativeDragEnd = () => {
			console.warn('[hive-dnd] dragend', {
				activeFrameId: activeFrameDragPayload?.frameId,
				activeBoxId: activeFrameDragPayload?.boxId,
			})
			activeFrameDragPayload = null
			setDragHoverIndex(null)
		}

		onNativeDragOver = (event) => {
			event.preventDefault()
			event.dataTransfer.dropEffect = 'move'
		}

		onNativeDropAtIndex = async (event, targetIndex) => {
			console.warn('[hive-dnd] drop:attempt', {
				targetBoxId: box.id,
				targetBoxType: box.type,
				targetIndex,
			})
			event.preventDefault()
			event.stopPropagation()

			const raw =
				event.dataTransfer.getData(frameDragPayloadMime) ||
				event.dataTransfer.getData('text/plain')
			let payload: any = activeFrameDragPayload
			if (raw) {
				try {
					payload = JSON.parse(raw)
				} catch {
					// Keep activeFrameDragPayload fallback
				}
			}

			if (
				!payload ||
				payload?.boxId === undefined ||
				payload?.boxType === undefined ||
				payload?.index === undefined
			) {
				console.warn('[hive-dnd] drop:missing-payload', {
					raw,
					activeFrameDragPayload,
				})
				return
			}

			console.warn('[hive-dnd] drop:resolved-payload', {
				sourceBoxId: payload.boxId,
				sourceBoxType: payload.boxType,
				sourceIndex: payload.index,
				frameId: payload.frameId,
				targetBoxId: box.id,
				targetIndex,
			})
			await applyFrameMove({
				sourceBoxId: +payload.boxId,
				sourceBoxType: payload.boxType,
				sourceIndex: +payload.index,
				targetBoxId: +box.id,
				targetIndex,
			})
			setDragHoverIndex(null)
		}

		onNativeDropAtEnd = async (event) => {
			const targetIndex = frames?.length || 0
			await onNativeDropAtIndex(event, targetIndex)
		}

			if (displayMode === 'list') {
				boxInnerDragProps = {
					onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
						onNativeDragOver(event)
						// Trigger first rerender during active drag without interrupting dragstart lifecycle.
						if (dragHoverIndex === null) {
							setDragHoverIndex(frames?.length || 0)
						}
					},
					onDragLeave: () => setDragHoverIndex(null),
					onDrop: (event: React.DragEvent<HTMLDivElement>) => {
						void onNativeDropAtEnd(event)
				},
			}
		}
	}

	if (frames && frames.length > 0) {
		const isListDragMode = editable && displayMode === 'list'
		const isCompatibleDrag = isListDragMode && activeFrameDragPayload?.boxType === box.type
		const shouldShowSlots = Boolean(activeFrameDragPayload) && isCompatibleDrag

		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]
			const isFrameDragged = activeFrameDragPayload?.frameId === frame.id

			if (shouldShowSlots) {
				const isHoveredSlot = dragHoverIndex === i
				framesDiv.push(
					<div
						key={`slot-${box.id}-${i}`}
						onDragOver={(event) => {
							onNativeDragOver(event)
							if (isCompatibleDrag) {
								setDragHoverIndex(i)
							}
						}}
						onDrop={(event) => {
							void onNativeDropAtIndex(event, i)
						}}
						style={{
							display: 'inline-block',
							height: 'calc(100% - 20px)',
							verticalAlign: 'top',
							marginTop: 10,
							marginBottom: 0,
							marginLeft: 2,
							marginRight: 2,
							width: isHoveredSlot ? 38 : 10,
							boxSizing: 'border-box',
							border: '2px dashed rgba(255,255,255,0.65)',
							borderRadius: 4,
							background: isHoveredSlot ? 'rgba(255,255,255,0.16)' : 'transparent',
							transition: 'width 120ms ease, background-color 120ms ease',
						}}
					/>
				)
			}

			const frameDiv = (
				<Frame
					key={frame.id}
					box={box}
					frameId={frameId}
					frameSideId={frameSideId}
					hiveId={hiveId}
					apiaryId={apiaryId}
					frame={frame}
					editable={editable}
					displayMode={displayMode}
					frameSidesData={frameSidesData}
					onFrameImageClick={onFrameImageClick}
					dragDropProps={
						isListDragMode
							? {
								draggable: true,
								onDragStart: (event: React.DragEvent<HTMLDivElement>) =>
									onNativeDragStart(event, {
										boxId: box.id,
										boxType: box.type,
										index: i,
										frameId: frame.id,
									}),
								onDragEnd: onNativeDragEnd,
								style: isFrameDragged
									? {
										opacity: 0.45,
										transform: 'scale(0.98)',
									}
									: undefined,
							}
							: undefined
					}
				/>
			)

			if (isListDragMode) {
				framesDiv.push(
					<div
						key={`drag-${frame.id}`}
						style={{
							display: 'inline-block',
							height: '100%',
							verticalAlign: 'top',
						}}
					>
						{frameDiv}
					</div>
				)
			} else {
				framesDiv.push(frameDiv)
			}
		}

		if (shouldShowSlots) {
			const lastSlotIndex = frames.length
			const isHoveredSlot = dragHoverIndex === lastSlotIndex
			framesDiv.push(
				<div
					key={`slot-${box.id}-${lastSlotIndex}`}
					onDragOver={(event) => {
						onNativeDragOver(event)
						setDragHoverIndex(lastSlotIndex)
					}}
					onDrop={(event) => {
						void onNativeDropAtIndex(event, lastSlotIndex)
					}}
					style={{
						display: 'inline-block',
						height: 'calc(100% - 20px)',
						verticalAlign: 'top',
						marginTop: 10,
						marginBottom: 0,
						marginLeft: 2,
						marginRight: 2,
						width: isHoveredSlot ? 38 : 10,
						boxSizing: 'border-box',
						border: '2px dashed rgba(255,255,255,0.65)',
						borderRadius: 4,
						background: isHoveredSlot ? 'rgba(255,255,255,0.16)' : 'transparent',
						transition: 'width 120ms ease, background-color 120ms ease',
					}}
				/>
			)
		}
	}

	framesWrapped = framesDiv

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
				<div className={styles.boxInner} {...boxInnerDragProps}>
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
