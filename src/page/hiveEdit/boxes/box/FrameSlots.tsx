import Frame from './boxFrame'
import { activeFrameDragPayload } from './useFrameDragHandlers'
import { BOX_SLOT_CAPACITY, getSlotCapacity } from './boxConstants'
import { LIST_SLOT_WIDTH_PX, VISUAL_FRAME_TOTAL_WIDTH_PX } from './geometry'

type FrameSlotsProps = {
	apiaryId: number
	box: any
	displayMode: string
	dragHoverIndex: number | null
	editable: boolean
	frameId: number
	frameSideId: number
	frames: any[]
	frameSidesData: any[]
	hiveId: number
	onFrameImageClick?: (imageUrl: string) => void
	onNativeDragEnd: () => void
	onNativeDragOver: (event: React.DragEvent<HTMLDivElement>) => void
	onNativeDragStart: (
		event: React.DragEvent<HTMLDivElement>,
		payload: any
	) => void
	onNativeDropAtIndex: (
		event: React.DragEvent<HTMLDivElement>,
		targetIndex: number
	) => void
	setDragHoverIndex: (index: number | null) => void
	slotRenderStartIndex: number
}

type FrameSlotsResult = {
	framesDiv: any[]
	renderedSlotCount: number
	renderedSlotStartIndex: number
}

export function renderFrameSlots({
	apiaryId,
	box,
	displayMode,
	dragHoverIndex,
	editable,
	frameId,
	frameSideId,
	frames,
	frameSidesData,
	hiveId,
	onFrameImageClick,
	onNativeDragEnd,
	onNativeDragOver,
	onNativeDragStart,
	onNativeDropAtIndex,
	setDragHoverIndex,
	slotRenderStartIndex,
}: FrameSlotsProps): FrameSlotsResult {
	let renderedSlotCount = 1
	let renderedSlotStartIndex = slotRenderStartIndex
	const framesDiv: any[] = []

	if (!frames || frames.length === 0) {
		return {
			framesDiv,
			renderedSlotCount,
			renderedSlotStartIndex,
		}
	}

	const isListDragMode = editable && displayMode === 'list'
	const isCompatibleDrag =
		isListDragMode && activeFrameDragPayload?.boxType === box.type
	const shouldShowSlots = Boolean(activeFrameDragPayload) && isCompatibleDrag
	const slotCapacity = getSlotCapacity(
		box.type,
		frames,
		BOX_SLOT_CAPACITY[box.type] || 10
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
	const occupiedSlotIndexes = [...frameBySlot.keys()].sort((a, b) => a - b)
	const visualSlotStart = occupiedSlotIndexes.length
		? occupiedSlotIndexes[0]
		: listSlotStart
	const visualSlotEnd = occupiedSlotIndexes.length
		? occupiedSlotIndexes[occupiedSlotIndexes.length - 1]
		: listSlotEnd
	const renderSlotStart =
		displayMode === 'visual' ? visualSlotStart : listSlotStart
	const renderSlotEnd = displayMode === 'visual' ? visualSlotEnd : listSlotEnd
	renderedSlotStartIndex = renderSlotStart
	renderedSlotCount = renderSlotEnd - renderSlotStart + 1
	const slotWidth =
		displayMode === 'visual' ? VISUAL_FRAME_TOTAL_WIDTH_PX : LIST_SLOT_WIDTH_PX

	for (let i = renderSlotStart; i <= renderSlotEnd; i++) {
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
					display: displayMode === 'visual' ? 'block' : 'inline-block',
					flex:
						displayMode === 'visual'
							? `0 1 ${VISUAL_FRAME_TOTAL_WIDTH_PX}px`
							: '0 0 auto',
					width: slotWidth,
					height: displayMode === 'visual' ? 'auto' : '100%',
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
					transition: 'background-color 120ms ease, outline-color 120ms ease',
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
						fitVisualSlot={displayMode === 'visual'}
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

	return {
		framesDiv,
		renderedSlotCount,
		renderedSlotStartIndex,
	}
}
