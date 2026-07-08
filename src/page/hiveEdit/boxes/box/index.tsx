import { useState } from 'react'

import { gql, useMutation, useQuery } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'
import { useTranslation as t } from '@/shared/translate'

import styles from './index.module.less'
import FRAMES_QUERY from './framesQuery.graphql.ts'
import { BOX_SLOT_CAPACITY, getSlotCapacity } from './boxConstants'
import type { BoxType } from './boxTypes'
import {
	getBeeBoundaryIndicators,
	getDisplayIndicators,
	getIndicatorLeft,
	getMaxBeeCount,
	getPositionedFrames,
	getSlotRenderStartIndex,
} from './beeIndicators'
import { renderFrameSlots } from './FrameSlots'
import {
	LIST_SECTION_PADDING_X_PX,
	LIST_SLOT_WIDTH_PX,
	VISUAL_SECTION_PADDING_X_PX,
} from './geometry'
import { useBoxFrames } from './useBoxFrames'
import { useFrameDragHandlers } from './useFrameDragHandlers'

export default function Box({
	box,
	frameId,
	frameSideId,
	apiaryId,
	hiveId,
	editable = true,
	selected = false,
	displayMode,
	frameSidesData = [],
	onFrameImageClick = (_imageUrl: string) => {},
}: BoxType): any {
	const tFrameRearranged = t('Frame rearranged')
	const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null)
	const frames = useBoxFrames(box.id, hiveId)
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

	const safeFrames = Array.isArray(frames) ? frames : []
	const positionedFrames = getPositionedFrames(safeFrames)
	const slotRenderStartIndex = getSlotRenderStartIndex(
		box.type,
		positionedFrames
	)
	const boundaryIndicators = getBeeBoundaryIndicators(positionedFrames)
	const displayIndicators = getDisplayIndicators(
		positionedFrames,
		boundaryIndicators
	)
	const maxBeeCount = getMaxBeeCount(displayIndicators)
	const listInnerStyle = {
		'--hive-section-padding-x': `${LIST_SECTION_PADDING_X_PX}px`,
	} as React.CSSProperties
	const visualInnerStyle = {
		'--hive-section-padding-x': `${VISUAL_SECTION_PADDING_X_PX}px`,
	} as React.CSSProperties

	const {
		boxInnerDragProps,
		onNativeDragEnd,
		onNativeDragOver,
		onNativeDragStart,
		onNativeDropAtIndex,
	} = useFrameDragHandlers({
		apiaryId,
		box,
		displayMode,
		dragHoverIndex,
		editable,
		frameSideId,
		frames: safeFrames,
		hiveId,
		setDragHoverIndex,
		tFrameRearranged,
		updateFramesRemote,
	})

	if (frames === false || loading) {
		return <Loader />
	}

	const { framesDiv, renderedSlotCount, renderedSlotStartIndex } =
		renderFrameSlots({
			apiaryId,
			box,
			displayMode,
			dragHoverIndex,
			editable,
			frameId,
			frameSideId,
			frames: safeFrames,
			frameSidesData,
			hiveId,
			onFrameImageClick,
			onNativeDragEnd,
			onNativeDragOver,
			onNativeDragStart,
			onNativeDropAtIndex,
			setDragHoverIndex,
			slotRenderStartIndex,
		})
	const framesWrapped = framesDiv

	// Keep vertical sections compact, but allow horizontal sections to fit full slot capacity.
	let maxWidthStyle: any = {}
	const shouldScrollList =
		displayMode === 'list' &&
		(box.type === 'LARGE_HORIZONTAL_SECTION' || safeFrames.length > 10)
	if (displayMode === 'list' && box.type === 'LARGE_HORIZONTAL_SECTION') {
		const slotCapacity = getSlotCapacity(
			box.type,
			safeFrames,
			BOX_SLOT_CAPACITY[box.type] || 25
		)
		maxWidthStyle = {
			minWidth: slotCapacity * LIST_SLOT_WIDTH_PX + 28,
			maxWidth: 'none',
		}
	}

	if (displayMode == 'visual') {
		function getVisualIndicatorLeftCss(boundarySlotIndex: number): string {
			const relativeBoundary = boundarySlotIndex - renderedSlotStartIndex
			const boundaryPercent = (relativeBoundary / renderedSlotCount) * 100
			return `calc(${boundaryPercent}% + 3px)`
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
					<div className={styles.boxInnerVisual} style={visualInnerStyle}>
						{!frames && <Loader size={1} />}
						{framesDiv}
						<div className={styles.indicatorLayer}>
							{displayIndicators.map((indicator) => {
								if (indicator.count <= 0) return null
								const leftPosition = getVisualIndicatorLeftCss(
									indicator.boundarySlotIndex
								)
								const indicatorHeightPercent =
									maxBeeCount > 0
										? Math.min(100, (indicator.count / maxBeeCount) * 100)
										: 0
								return (
									<div
										key={`indicator-line-${indicator.key}`}
										className={styles.betweenFrameIndicator}
										style={{ left: leftPosition }}
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
							const leftPosition = getVisualIndicatorLeftCss(
								indicator.boundarySlotIndex
							)
							return (
								<div
									key={`indicator-count-${indicator.key}`}
									className={styles.indicatorCount}
									style={{ left: leftPosition }}
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
					className={`${styles.boxInner} ${
						shouldScrollList ? styles.boxInnerScrollable : ''
					}`}
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
								slotRenderStartIndex,
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
