import { describe, expect, it } from 'vitest'

import {
	getListIndicatorLeftPx,
	getVisualIndicatorLeftPx,
} from './indicatorPosition'
import {
	INDICATOR_WIDTH_PX,
	LIST_FOUNDATION_WIDTH_PX,
	LIST_FRAME_BODY_WIDTH_PX,
	LIST_FRAME_GAP_PX,
	LIST_FRAME_SIDE_WIDTH_PX,
	LIST_SLOT_WIDTH_PX,
	VISUAL_FRAME_SIDE_GAP_PX,
	VISUAL_FRAME_SIDE_WIDTH_PX,
	VISUAL_FRAME_TOTAL_WIDTH_PX,
} from './geometry'

describe('hive box indicator position', () => {
	it('models list frame widths from side/foundation constants', () => {
		expect(LIST_FRAME_BODY_WIDTH_PX).toBe(
			LIST_FRAME_SIDE_WIDTH_PX * 2 + LIST_FOUNDATION_WIDTH_PX
		)
		expect(LIST_SLOT_WIDTH_PX).toBe(LIST_FRAME_BODY_WIDTH_PX + LIST_FRAME_GAP_PX)
	})

	it('models visual frame width from side width and side gap constants', () => {
		expect(VISUAL_FRAME_TOTAL_WIDTH_PX).toBe(
			VISUAL_FRAME_SIDE_WIDTH_PX * 2 + VISUAL_FRAME_SIDE_GAP_PX
		)
	})

	it('positions between-frame indicator at boundary center in list mode', () => {
		const left = getListIndicatorLeftPx({
			boundarySlotIndex: 1,
			slotRenderStartIndex: 0,
			hasLeftContribution: true,
			hasRightContribution: true,
		})
		expect(left).toBe(LIST_SLOT_WIDTH_PX)
	})

	it('positions left-edge-only indicator on boundary center in list mode', () => {
		const left = getListIndicatorLeftPx({
			boundarySlotIndex: 0,
			slotRenderStartIndex: 0,
			hasLeftContribution: true,
			hasRightContribution: false,
		})
		expect(left).toBe(0)
	})

	it('positions right-edge-only indicator on boundary center in list mode', () => {
		const left = getListIndicatorLeftPx({
			boundarySlotIndex: 1,
			slotRenderStartIndex: 0,
			hasLeftContribution: false,
			hasRightContribution: true,
		})
		expect(left).toBe(LIST_SLOT_WIDTH_PX)
	})

	it('respects slotRenderStartIndex offset in list mode', () => {
		const left = getListIndicatorLeftPx({
			boundarySlotIndex: 3,
			slotRenderStartIndex: 2,
			hasLeftContribution: true,
			hasRightContribution: true,
		})
		expect(left).toBe(LIST_SLOT_WIDTH_PX)
	})

	it('uses fixed visual step for visual mode', () => {
		const left = getVisualIndicatorLeftPx({
			boundarySlotIndex: 2,
			slotRenderStartIndex: 0,
			hasLeftContribution: true,
			hasRightContribution: true,
		})
		expect(left).toBe(VISUAL_FRAME_TOTAL_WIDTH_PX * 2 + 3)
	})
})
