import isNil from 'lodash/isNil'
import { useNavigate } from 'react-router-dom'

import { Frame as FrameType, getFrames, updateFrame } from '@/models/frames'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'

import { FRAME_DRAG_PAYLOAD_MIME, getSlotCapacity } from './boxConstants'

export let activeFrameDragPayload: any = null

type UseFrameDragHandlersArgs = {
	apiaryId: number
	box: any
	displayMode: string
	dragHoverIndex: number | null
	editable: boolean
	frameSideId: number
	frames: any[]
	hiveId: number
	setDragHoverIndex: (index: number | null) => void
	tFrameRearranged: string
	updateFramesRemote: (variables: { frames: any[] }) => Promise<any>
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

function getDropPayload(event: React.DragEvent<HTMLDivElement>) {
	const raw =
		event.dataTransfer.getData(FRAME_DRAG_PAYLOAD_MIME) ||
		event.dataTransfer.getData('text/plain')
	let payload: any = activeFrameDragPayload
	if (raw) {
		try {
			payload = JSON.parse(raw)
		} catch {
			// Keep activeFrameDragPayload fallback
		}
	}

	return { payload, raw }
}

function hasValidDropPayload(payload: any) {
	return !(
		!payload ||
		payload?.boxId === undefined ||
		payload?.boxType === undefined ||
		payload?.index === undefined
	)
}

export function useFrameDragHandlers({
	apiaryId,
	box,
	displayMode,
	dragHoverIndex,
	editable,
	frameSideId,
	frames,
	hiveId,
	setDragHoverIndex,
	tFrameRearranged,
	updateFramesRemote,
}: UseFrameDragHandlersArgs) {
	const navigate = useNavigate()

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

	function onNativeDragStart(
		event: React.DragEvent<HTMLDivElement>,
		payload: any
	) {
		console.warn('[hive-dnd] dragstart', {
			sourceBoxId: payload?.boxId,
			sourceBoxType: payload?.boxType,
			sourceIndex: payload?.index,
			frameId: payload?.frameId,
		})
		event.stopPropagation()
		event.dataTransfer.effectAllowed = 'move'
		const raw = JSON.stringify(payload)
		event.dataTransfer.setData(FRAME_DRAG_PAYLOAD_MIME, raw)
		event.dataTransfer.setData('text/plain', raw)

		activeFrameDragPayload = payload
	}

	function onNativeDragEnd() {
		console.warn('[hive-dnd] dragend', {
			activeFrameId: activeFrameDragPayload?.frameId,
			activeBoxId: activeFrameDragPayload?.boxId,
		})
		activeFrameDragPayload = null
		setDragHoverIndex(null)
	}

	function onNativeDragOver(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault()
		event.dataTransfer.dropEffect = 'move'
	}

	async function onNativeDropAtIndex(
		event: React.DragEvent<HTMLDivElement>,
		targetIndex: number
	) {
		console.warn('[hive-dnd] drop:attempt', {
			targetBoxId: box.id,
			targetBoxType: box.type,
			targetIndex,
		})
		event.preventDefault()
		event.stopPropagation()

		const { payload, raw } = getDropPayload(event)

		if (!hasValidDropPayload(payload)) {
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

	async function onNativeDropAtEnd(event: React.DragEvent<HTMLDivElement>) {
		const slotCapacity = getSlotCapacity(box.type, frames, 10)
		const lastOccupiedIndex = frames.reduce(
			(max, frame) => Math.max(max, +(frame?.position || 0) - 1),
			-1
		)
		const targetIndex = Math.min(
			slotCapacity - 1,
			Math.max(0, lastOccupiedIndex + 1)
		)
		await onNativeDropAtIndex(event, targetIndex)
	}

	const boxInnerDragProps =
		editable && displayMode === 'list'
			? {
					onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
						onNativeDragOver(event)
						// Trigger first rerender during active drag without interrupting dragstart lifecycle.
						if (dragHoverIndex === null) {
							const lastOccupiedIndex = frames.reduce(
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
			: {}

	return {
		boxInnerDragProps,
		onNativeDragEnd,
		onNativeDragOver,
		onNativeDragStart,
		onNativeDropAtIndex,
	}
}
