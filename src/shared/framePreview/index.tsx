import { memo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getFrameSidePreviewImage } from '@/models/frameSideFile'
import styles from './styles.module.less'

interface FramePreviewProps {
	frameId: number
	position: number
	leftId?: number
	rightId?: number
	isSelected?: boolean
	onClick?: () => void
	showCheckbox?: boolean
}

function FramePreview({
	frameId,
	position,
	leftId,
	rightId,
	isSelected = false,
	onClick,
	showCheckbox = false,
}: FramePreviewProps) {
	console.log(`[FramePreview] Rendering frame ${frameId}, position ${position}, isSelected: ${isSelected}`)

	const leftSideFile = useLiveQuery(
		async () => leftId ? await getFrameSidePreviewImage(leftId) : null,
		[leftId],
		null
	)

	const rightSideFile = useLiveQuery(
		async () => rightId ? await getFrameSidePreviewImage(rightId) : null,
		[rightId],
		null
	)

	const getResizedUrl = (file) => {
		if (!file) return null

		if (file.resizes && Array.isArray(file.resizes) && file.resizes.length > 0) {
			const validResizes = file.resizes.filter(r => r && r.url && r.max_dimension_px)

			if (validResizes.length > 0) {
				const smallestResize = validResizes.reduce((smallest, current) => {
					return current.max_dimension_px < smallest.max_dimension_px ? current : smallest
				})
				return smallestResize.url
			}
		}

		return file.url
	}

	const leftImageUrl = getResizedUrl(leftSideFile)
	const rightImageUrl = getResizedUrl(rightSideFile)

	const handleClick = useCallback((e) => {
		e.preventDefault()
		e.stopPropagation()
		if (onClick) onClick()
	}, [onClick])

	return (
		<div
			className={`${styles.framePreview} ${isSelected ? styles.selected : ''}`}
			onClick={handleClick}
		>
			{showCheckbox && (
				<input
					type="checkbox"
					checked={isSelected}
					readOnly
					className={styles.checkbox}
				/>
			)}
			<div className={styles.frameNumber}>#{position + 1}</div>
			<div className={styles.frameSides}>
				<div className={styles.frameSide}>
					{leftImageUrl ? (
						<img src={leftImageUrl} alt={`Frame ${position + 1} left`} loading="lazy" />
					) : (
						<div className={styles.noImage}>L</div>
					)}
				</div>
				<div className={styles.frameSide}>
					{rightImageUrl ? (
						<img src={rightImageUrl} alt={`Frame ${position + 1} right`} loading="lazy" />
					) : (
						<div className={styles.noImage}>R</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default memo(FramePreview, (prevProps, nextProps) => {
	const shouldSkipRender = (
		prevProps.frameId === nextProps.frameId &&
		prevProps.position === nextProps.position &&
		prevProps.leftId === nextProps.leftId &&
		prevProps.rightId === nextProps.rightId &&
		prevProps.isSelected === nextProps.isSelected &&
		prevProps.showCheckbox === nextProps.showCheckbox &&
		prevProps.onClick === nextProps.onClick
	)

	if (!shouldSkipRender) {
		console.log(`[FramePreview memo] Re-rendering frame ${nextProps.frameId}:`, {
			frameIdChanged: prevProps.frameId !== nextProps.frameId,
			positionChanged: prevProps.position !== nextProps.position,
			leftIdChanged: prevProps.leftId !== nextProps.leftId,
			rightIdChanged: prevProps.rightId !== nextProps.rightId,
			isSelectedChanged: prevProps.isSelected !== nextProps.isSelected,
			showCheckboxChanged: prevProps.showCheckbox !== nextProps.showCheckbox,
			onClickChanged: prevProps.onClick !== nextProps.onClick,
		})
	}

	return shouldSkipRender
})

