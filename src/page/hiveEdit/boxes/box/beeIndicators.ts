import {
	getListIndicatorLeftPx,
	getVisualIndicatorLeftPx,
} from './indicatorPosition'

export type PositionedFrame = {
	frame: any
	slotIndex: number
}

export type BeeBoundaryIndicator = {
	key: string
	count: number
	boundarySlotIndex: number
	hasLeftContribution: boolean
	hasRightContribution: boolean
}

function getBeeCountForSide(frameSide: any): number {
	return (
		(frameSide?.frameSideFile?.detectedWorkerBeeCount || 0) +
		(frameSide?.frameSideFile?.detectedDroneCount || 0)
	)
}

export function getPositionedFrames(frames: any[]): PositionedFrame[] {
	return frames
		.map((frame) => ({
			frame,
			slotIndex: Math.max(0, +(frame?.position || 1) - 1),
		}))
		.sort((a, b) => a.slotIndex - b.slotIndex)
}

export function getSlotRenderStartIndex(
	boxType: string,
	positionedFrames: PositionedFrame[]
): number {
	const firstOccupiedSlotIndex = positionedFrames.length
		? positionedFrames[0].slotIndex
		: 0

	return boxType === 'LARGE_HORIZONTAL_SECTION'
		? Math.max(0, firstOccupiedSlotIndex - 1)
		: 0
}

export function getBeeBoundaryIndicators(
	positionedFrames: PositionedFrame[]
): BeeBoundaryIndicator[] {
	const boundaryIndicatorMap = new Map<
		number,
		{
			count: number
			hasLeftContribution: boolean
			hasRightContribution: boolean
		}
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

	return [...boundaryIndicatorMap.entries()]
		.map(([boundarySlotIndex, value]) => ({
			key: `boundary-${boundarySlotIndex}`,
			count: value.count,
			boundarySlotIndex,
			hasLeftContribution: value.hasLeftContribution,
			hasRightContribution: value.hasRightContribution,
		}))
		.sort((a, b) => a.boundarySlotIndex - b.boundarySlotIndex)
}

export function getDisplayIndicators(
	positionedFrames: PositionedFrame[],
	boundaryIndicators: BeeBoundaryIndicator[]
): BeeBoundaryIndicator[] {
	const occupiedSlots = new Set(
		positionedFrames.map(({ slotIndex }) => slotIndex)
	)

	return boundaryIndicators.filter((indicator) => {
		const hasFrameOnLeft = occupiedSlots.has(indicator.boundarySlotIndex - 1)
		const hasFrameOnRight = occupiedSlots.has(indicator.boundarySlotIndex)
		return hasFrameOnLeft || hasFrameOnRight
	})
}

export function getMaxBeeCount(indicators: BeeBoundaryIndicator[]): number {
	return Math.max(...indicators.map((indicator) => indicator.count), 0)
}

export function getIndicatorLeft(
	indicator: {
		boundarySlotIndex: number
		hasLeftContribution: boolean
		hasRightContribution: boolean
	},
	slotRenderStartIndex: number,
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
