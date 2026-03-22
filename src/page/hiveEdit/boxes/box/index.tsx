import isNil from 'lodash/isNil'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery, useSubscription } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'
import { useTranslation as t } from '@/shared/translate'

import { Frame as FrameType, getFrames, updateFrame } from '@/models/frames'
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
import {
	LIST_SLOT_WIDTH_PX,
	LIST_SECTION_PADDING_X_PX,
	VISUAL_SECTION_PADDING_X_PX,
} from './geometry'
import {
	getListIndicatorLeftPx,
	getVisualIndicatorLeftPx,
} from './indicatorPosition'

let activeFrameDragPayload: any = null
const BOX_SLOT_CAPACITY: Record<string, number> = {
	DEEP: 10,
	SUPER: 10,
	LARGE_HORIZONTAL_SECTION: 25,
}

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
			if (!framesWithoutSides) return null
			const framesWithoutCells = await enrichFramesWithSides(framesWithoutSides)
			if (!framesWithoutCells) return null
			const framesWithoutFiles = await enrichFramesWithSideCells(
				framesWithoutCells
			)
			if (!framesWithoutFiles) return null
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

	const safeFrames = Array.isArray(frames) ? frames : []
	const positionedFrames = safeFrames
		.map((frame) => ({
			frame,
			slotIndex: Math.max(0, +(frame?.position || 1) - 1),
		}))
		.sort((a, b) => a.slotIndex - b.slotIndex)
	const firstOccupiedSlotIndex = positionedFrames.length
		? positionedFrames[0].slotIndex
		: 0
	const slotRenderStartIndex =
		box.type === 'LARGE_HORIZONTAL_SECTION'
			? Math.max(0, firstOccupiedSlotIndex - 1)
			: 0

	function getBeeCountForSide(frameSide: any): number {
		return (
			(frameSide?.frameSideFile?.detectedWorkerBeeCount || 0) +
			(frameSide?.frameSideFile?.detectedDroneCount || 0)
		)
	}

	const boundaryIndicatorMap = new Map<
		number,
		{ count: number; hasLeftContribution: boolean; hasRightContribution: boolean }
	>()
	for (const { frame, slotIndex } of positionedFrames) {
		const leftBoundary = slotIndex
		const rightBoundary = slotIndex + 1
		const leftCount = getBeeCountForSide(frame?.leftSide)
		const rightCount = getBeeCountForSide(frame?.rightSide)
		const leftBoundaryEntry = boundaryIndicatorMap.get(leftBoundary) || {
			count: 0,
			hasLeftContribution: false,
			hasRightContribution: false,
		}
		leftBoundaryEntry.count += leftCount
		leftBoundaryEntry.hasLeftContribution = true
		boundaryIndicatorMap.set(leftBoundary, leftBoundaryEntry)

		const rightBoundaryEntry = boundaryIndicatorMap.get(rightBoundary) || {
			count: 0,
			hasLeftContribution: false,
			hasRightContribution: false,
		}
		rightBoundaryEntry.count += rightCount
		rightBoundaryEntry.hasRightContribution = true
		boundaryIndicatorMap.set(rightBoundary, rightBoundaryEntry)
	}

	const boundaryIndicators: Array<{
		key: string
		count: number
		boundarySlotIndex: number
		hasLeftContribution: boolean
		hasRightContribution: boolean
	}> = [...boundaryIndicatorMap.entries()]
		.map(([boundarySlotIndex, value]) => ({
			key: `boundary-${boundarySlotIndex}`,
			count: value.count,
			boundarySlotIndex,
			hasLeftContribution: value.hasLeftContribution,
			hasRightContribution: value.hasRightContribution,
		}))
		.sort((a, b) => a.boundarySlotIndex - b.boundarySlotIndex)

	const occupiedSlots = new Set(
		positionedFrames.map(({ slotIndex }) => slotIndex)
	)
	const displayIndicators = boundaryIndicators.filter((indicator) => {
		const hasFrameOnLeft = occupiedSlots.has(indicator.boundarySlotIndex - 1)
		const hasFrameOnRight = occupiedSlots.has(indicator.boundarySlotIndex)
		return hasFrameOnLeft || hasFrameOnRight
	})

	const maxBeeCount = Math.max(
		...displayIndicators.map((indicator) => indicator.count),
		0
	)

	function getIndicatorLeft(
		indicator: {
			boundarySlotIndex: number
			hasLeftContribution: boolean
			hasRightContribution: boolean
		},
		mode: 'visual' | 'list'
	): number {
		if (mode === 'list') {
			return getListIndicatorLeftPx({
				boundarySlotIndex: indicator.boundarySlotIndex,
				slotRenderStartIndex,
				hasLeftContribution: indicator.hasLeftContribution,
				hasRightContribution: indicator.hasRightContribution,
			})
		}

		return getVisualIndicatorLeftPx({
			boundarySlotIndex: indicator.boundarySlotIndex,
			slotRenderStartIndex,
			hasLeftContribution: indicator.hasLeftContribution,
			hasRightContribution: indicator.hasRightContribution,
		})
	}

	let framesWrapped: any = framesDiv
	const listInnerStyle = {
		'--hive-section-padding-x': `${LIST_SECTION_PADDING_X_PX}px`,
	} as React.CSSProperties
	const visualInnerStyle = {
		'--hive-section-padding-x': `${VISUAL_SECTION_PADDING_X_PX}px`,
	} as React.CSSProperties
	let onNativeDragStart = (
		event: React.DragEvent<HTMLDivElement>,
		payload: any
	) => {}
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
			const framesByBoxRaw = await Promise.all(
				distinctBoxIds.map((id) => getFrames({ boxId: +id }))
			)

			const framesByBox = framesByBoxRaw.map((boxFramesRaw, boxIndex) => {
				const boxId = +distinctBoxIds[boxIndex]
				const boxFrames = (boxFramesRaw || []).filter(Boolean)
				return boxFrames.map((frame: any, idx: number) => {
					const normalizedPosition =
						Number.isFinite(+frame?.position) && +frame.position > 0
							? +frame.position
							: idx + 1
					frame.position = normalizedPosition
					frame.boxId = boxId
					return frame
				})
			})

			await Promise.all(framesByBox.flat().map((frame) => updateFrame(frame)))

			const frames = framesByBox.flat().map((v: FrameType) => {
				const r: any = {
					...v,
				}
				r.position =
					Number.isFinite(+r.position) && +r.position > 0 ? +r.position : 1
				delete r.rightId
				delete r.leftId
				delete r.leftSide
				delete r.rightSide
				delete r.__typename
				return r
			})

			await updateFramesRemote({ frames })
		}

		function getSlotCapacity(boxType: string, boxFrames: any[]): number {
			const base = BOX_SLOT_CAPACITY[boxType] || 10
			const maxPosition = boxFrames.reduce(
				(max, frame) => Math.max(max, +(frame?.position || 0)),
				0
			)
			return Math.max(base, maxPosition)
		}

		function toSlots(boxFrames: any[], capacity: number): (any | null)[] {
			const slots = Array.from({ length: capacity }, () => null)
			for (const frame of boxFrames) {
				const slotIndex = +frame.position - 1
				if (slotIndex >= 0 && slotIndex < capacity && !slots[slotIndex]) {
					slots[slotIndex] = frame
				}
			}
			return slots
		}

		function findAndRemoveFrame(slots: (any | null)[], frameId?: number) {
			if (!frameId) return null
			const index = slots.findIndex((frame) => frame && +frame.id === +frameId)
			if (index < 0) return null
			const frame = slots[index]
			slots[index] = null
			return frame
		}

		function placeFrameWithRightShift(
			slots: (any | null)[],
			frame: any,
			targetIndex: number
		): boolean {
			if (targetIndex < 0 || targetIndex >= slots.length) {
				return false
			}

			if (!slots[targetIndex]) {
				slots[targetIndex] = frame
				return true
			}

			let emptyIndex = -1
			for (let i = targetIndex + 1; i < slots.length; i++) {
				if (!slots[i]) {
					emptyIndex = i
					break
				}
			}

			if (emptyIndex < 0) {
				return false
			}

			for (let i = emptyIndex; i > targetIndex; i--) {
				slots[i] = slots[i - 1]
			}
			slots[targetIndex] = frame
			return true
		}

		function assignPositionsFromSlots(slots: (any | null)[]) {
			const updated: any[] = []
			for (let i = 0; i < slots.length; i++) {
				const frame = slots[i]
				if (!frame) continue
				frame.position = i + 1
				updated.push(frame)
			}
			return updated
		}

		async function persistFrames(framesToPersist: any[]) {
			await Promise.all(framesToPersist.map((frame) => updateFrame(frame)))
		}

		async function applyFrameMove({
			sourceBoxId,
			sourceBoxType,
			sourceIndex,
			targetBoxId,
			targetIndex,
			frameId,
		}: {
			sourceBoxId: number
			sourceBoxType: string
			sourceIndex: number
			targetBoxId: number
			targetIndex: number
			frameId?: number
		}) {
			if (sourceBoxType !== box.type) {
				return
			}

			const sourceFrames = (await getFrames({ boxId: +sourceBoxId })) || []
			const targetFrames =
				sourceBoxId === targetBoxId
					? sourceFrames
					: (await getFrames({ boxId: +targetBoxId })) || []

			const sourceCapacity = getSlotCapacity(sourceBoxType, sourceFrames)
			const targetCapacity = getSlotCapacity(box.type, targetFrames)
			const sourceSlots = toSlots(sourceFrames, sourceCapacity)
			const targetSlots =
				sourceBoxId === targetBoxId
					? sourceSlots
					: toSlots(targetFrames, targetCapacity)

			let movingFrame = sourceSlots[sourceIndex]
			if (!movingFrame) {
				movingFrame = findAndRemoveFrame(sourceSlots, frameId) || null
			} else {
				sourceSlots[sourceIndex] = null
			}

			if (!movingFrame) {
				return
			}

			const safeTargetIndex = Math.max(
				0,
				Math.min(targetIndex, targetSlots.length - 1)
			)
			const placed = placeFrameWithRightShift(
				targetSlots,
				movingFrame,
				safeTargetIndex
			)
			if (!placed) {
				// No free slot to the right in the target section.
				return
			}

			const sourceUpdated = assignPositionsFromSlots(sourceSlots).map(
				(frame) => ({
					...frame,
					boxId: +sourceBoxId,
				})
			)
			const targetUpdated =
				sourceBoxId === targetBoxId
					? sourceUpdated
					: assignPositionsFromSlots(targetSlots).map((frame) => ({
							...frame,
							boxId: +targetBoxId,
					  }))

			await persistFrames(
				sourceBoxId === targetBoxId
					? sourceUpdated
					: [...sourceUpdated, ...targetUpdated]
			)
			await updateFramesForBoxes(
				sourceBoxId === targetBoxId ? [targetBoxId] : [sourceBoxId, targetBoxId]
			)

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
				frameId: payload.frameId ? +payload.frameId : undefined,
			})
			setDragHoverIndex(null)
		}

		onNativeDropAtEnd = async (event) => {
			const slotCapacity = Math.max(
				BOX_SLOT_CAPACITY[box.type] || 10,
				(frames || []).reduce(
					(max, frame) => Math.max(max, +(frame?.position || 0)),
					0
				)
			)
			const lastOccupiedIndex = (frames || []).reduce(
				(max, frame) => Math.max(max, +(frame?.position || 0) - 1),
				-1
			)
			const targetIndex = Math.min(
				slotCapacity - 1,
				Math.max(0, lastOccupiedIndex + 1)
			)
			await onNativeDropAtIndex(event, targetIndex)
		}

		if (displayMode === 'list') {
			boxInnerDragProps = {
				onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
					onNativeDragOver(event)
					// Trigger first rerender during active drag without interrupting dragstart lifecycle.
					if (dragHoverIndex === null) {
						const lastOccupiedIndex = (frames || []).reduce(
							(max, frame) => Math.max(max, +(frame?.position || 0) - 1),
							-1
						)
						setDragHoverIndex(Math.max(0, lastOccupiedIndex + 1))
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
		const isCompatibleDrag =
			isListDragMode && activeFrameDragPayload?.boxType === box.type
		const shouldShowSlots = Boolean(activeFrameDragPayload) && isCompatibleDrag
		const slotCapacity = Math.max(
			BOX_SLOT_CAPACITY[box.type] || 10,
			frames.reduce((max, frame) => Math.max(max, +(frame?.position || 0)), 0)
		)
		const frameBySlot = new Map<number, any>()
		for (const frame of frames) {
			const slotIndex = +frame.position - 1
			if (
				slotIndex >= 0 &&
				slotIndex < slotCapacity &&
				!frameBySlot.has(slotIndex)
			) {
				frameBySlot.set(slotIndex, frame)
			}
		}
		const listSlotStart = slotRenderStartIndex
		const listSlotEnd = slotCapacity - 1

		for (let i = listSlotStart; i <= listSlotEnd; i++) {
			const frame = frameBySlot.get(i)
			const isEmptySlot = !frame
			const isFrameDragged =
				!isEmptySlot && activeFrameDragPayload?.frameId === frame.id

			const slotIsHovered = dragHoverIndex === i
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
						flex: '0 0 auto',
						width: LIST_SLOT_WIDTH_PX,
						height: '100%',
						verticalAlign: 'top',
						marginLeft: 0,
						marginRight: 0,
						boxSizing: 'border-box',
						outline: shouldShowSlots
							? '2px dashed rgba(255,255,255,0.45)'
							: '2px dashed transparent',
						outlineOffset: -2,
						borderRadius: 4,
						background:
							shouldShowSlots && slotIsHovered
								? 'rgba(255,255,255,0.14)'
								: 'transparent',
						transition:
							'background-color 120ms ease, outline-color 120ms ease',
					}}
				>
					{!isEmptySlot && (
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
					)}
				</div>
			)
		}
	}

	framesWrapped = framesDiv

	// Keep vertical sections compact, but allow horizontal sections to fit full slot capacity.
	let maxWidthStyle: any = {}
	if (box.type === 'LARGE_HORIZONTAL_SECTION') {
		const slotCapacity = Math.max(
			BOX_SLOT_CAPACITY[box.type] || 25,
			(frames || []).reduce(
				(max, frame) => Math.max(max, +(frame?.position || 0)),
				0
			)
		)
		maxWidthStyle = {
			minWidth: slotCapacity * LIST_SLOT_WIDTH_PX + 28,
			maxWidth: 'none',
		}
	} else if (frames.length > 10) {
		maxWidthStyle = {
			maxWidth: 32 * 12 + 10,
		}
	}

	if (displayMode == 'visual') {
		return (
			<>
				<ErrorMessage error={error} />
				<div
					className={`${styles.boxOuter} ${selected && styles.selected}`}
					style={maxWidthStyle}
				>
					<div className={styles.boxInnerVisual} style={visualInnerStyle}>
						{!frames && <Loader size={1} />}
						{framesDiv}
						<div className={styles.indicatorLayer}>
							{displayIndicators.map((indicator) => {
								if (indicator.count <= 0) return null
								const leftPosition = getIndicatorLeft(
									indicator,
									'visual'
								)
								const indicatorHeightPercent =
									maxBeeCount > 0
										? Math.min(100, (indicator.count / maxBeeCount) * 100)
										: 0
								return (
									<div
										key={`indicator-line-${indicator.key}`}
										className={styles.betweenFrameIndicator}
										style={{ left: `${leftPosition}px` }}
									>
										<div
											className={styles.indicatorLine}
											style={{ height: `${indicatorHeightPercent}%` }}
										/>
									</div>
								)
							})}
						</div>
						{displayIndicators.map((indicator) => {
							if (indicator.count <= 0) return null
							const leftPosition = getIndicatorLeft(
								indicator,
								'visual'
							)
							return (
								<div
									key={`indicator-count-${indicator.key}`}
									className={styles.indicatorCount}
									style={{ left: `${leftPosition}px` }}
								>
									{indicator.count}
								</div>
							)
						})}
					</div>
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
					<div
						className={styles.boxInner}
						style={listInnerStyle}
						{...boxInnerDragProps}
					>
						{!frames && <Loader size={1} />}
						{framesWrapped}
						<div className={styles.indicatorLayer} style={{ zIndex: 2 }}>
							{displayIndicators.map((indicator) => {
								if (indicator.count <= 0) return null
								const leftPosition = getIndicatorLeft(
									indicator,
								'list'
							)
							const indicatorHeightPercent =
								maxBeeCount > 0
									? Math.min(100, (indicator.count / maxBeeCount) * 100)
									: 0
							return (
								<div
									key={`indicator-line-list-${indicator.key}`}
									className={styles.betweenFrameIndicator}
									style={{ left: `${leftPosition}px` }}
								>
									<div
										className={styles.indicatorLine}
										style={{ height: `${indicatorHeightPercent}%` }}
										/>
									</div>
								)
							})}
						</div>
					</div>
				</div>
		</>
	)
}
