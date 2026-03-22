import {
	INDICATOR_WIDTH_PX,
	LIST_SLOT_WIDTH_PX,
	VISUAL_FRAME_TOTAL_WIDTH_PX,
} from './geometry'

export type BoundaryIndicatorPositionInput = {
	boundarySlotIndex: number
	slotRenderStartIndex: number
	hasLeftContribution: boolean
	hasRightContribution: boolean
}

const HALF_INDICATOR_WIDTH_PX = INDICATOR_WIDTH_PX / 2
const VISUAL_INDICATOR_OFFSET_PX = 1

export function getListIndicatorLeftPx({
	boundarySlotIndex,
	slotRenderStartIndex,
}: BoundaryIndicatorPositionInput): number {
	const relativeBoundary = boundarySlotIndex - slotRenderStartIndex
	const boundaryCenterX = relativeBoundary * LIST_SLOT_WIDTH_PX
	return boundaryCenterX
}

export function getVisualIndicatorLeftPx({
	boundarySlotIndex,
	slotRenderStartIndex,
}: BoundaryIndicatorPositionInput): number {
	return (
		(boundarySlotIndex - slotRenderStartIndex) * VISUAL_FRAME_TOTAL_WIDTH_PX +
		VISUAL_INDICATOR_OFFSET_PX +
		HALF_INDICATOR_WIDTH_PX
	)
}

export const __test_only__ = {
	HALF_INDICATOR_WIDTH_PX,
}
