import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { Box } from '@/models/boxes.ts'
import { Frame } from '@/models/frames.ts'
import { enrichFramesWithSides } from '@/models/frameSide.ts'
import { getDominantResourceColorForFrameSide } from '@/models/frameSideCells.ts' // Import new function

import styles from './index.module.less'
import FrameSideImage from './frameSideImage'
import BoxFrameEmptyComb from './boxFrameEmptyComb'

export default function BoxFrame({
	box,
	apiaryId,
	hiveId,
	frameId,
	frameSideId,
	frame,
	editable = true,
	displayMode = 'visual',
	// Destructure new props here
	frameSidesData,
	onFrameImageClick,
	dragDropProps,
}: {
	box: Box
	apiaryId: number
	hiveId: number
	frameId: number
	frameSideId: number
	frame: Frame

	editable: boolean // Use primitive boolean type
	displayMode: string
	// Add new props
	frameSidesData?: any[]
	onFrameImageClick?: (imageUrl: string) => void
	dragDropProps?: any
}) {
	if (!frame || !box) return null

	const selectedFrame = frame.id === +frameId
	let frameInternal = null

	let navigate = useNavigate()
	const frameURL = `/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}`

	const leftSideId = Number(frame.leftId)
	const rightSideId = Number(frame.rightId)
	const hasValidLeftSide = Number.isFinite(leftSideId) && leftSideId > 0
	const hasValidRightSide = Number.isFinite(rightSideId) && rightSideId > 0
	const leftSideDep = hasValidLeftSide ? leftSideId : 0
	const rightSideDep = hasValidRightSide ? rightSideId : 0

	// Fetch dominant colors for both sides using useLiveQuery (only for valid side ids)
	const leftDominantColor = useLiveQuery(
		() =>
			hasValidLeftSide
				? getDominantResourceColorForFrameSide(leftSideId)
				: Promise.resolve(null),
		[leftSideDep] // Re-run query when a valid side id changes
	)
	const rightDominantColor = useLiveQuery(
		() =>
			hasValidRightSide
				? getDominantResourceColorForFrameSide(rightSideId)
				: Promise.resolve(null),
		[rightSideDep] // Re-run query when a valid side id changes
	)

	// Find the specific data for left and right sides from the passed array
	const leftSideData = frameSidesData?.find(
		(fs) => +fs.frameSideId === +frame.leftId
	)
	const rightSideData = frameSidesData?.find(
		(fs) => +fs.frameSideId === +frame.rightId
	)

	if (displayMode == 'visual') {
		if (frame.type === 'FOUNDATION' || frame.type === 'EMPTY_COMB') {
			return (
				// Added wrapper for relative positioning of overlay and indicator
				<div
					className={styles.listFrameIconWrapper}
					data-frame-clickable="true"
				>
					<div className={styles.listFrameIcon}>
						<FrameSideImage
							frameSideId={frame.leftId}
							dominantColor={leftDominantColor} // Pass color prop
							// Pass down specific side data and click handler
							frameSideData={leftSideData}
							onImageClick={onFrameImageClick}
							frameURL={`${frameURL}/${frame.leftId}`}
							selected={+frameSideId == +frame.leftId}
							editable={editable}
						/>

						<FrameSideImage
							frameSideId={frame.rightId}
							dominantColor={rightDominantColor} // Pass color prop
							// Pass down specific side data and click handler
							frameSideData={rightSideData}
							onImageClick={onFrameImageClick}
							frameURL={`${frameURL}/${frame.rightId}`}
							selected={+frameSideId == +frame.rightId}
							editable={editable}
						/>
					</div>
				</div>
			)
		} else {
			// TODO add more frame type renditions from the side
			return
		}
	}

	if (frame.type === 'EMPTY_COMB') {
		frameInternal = (
			<BoxFrameEmptyComb
				frameURL={frameURL}
				frame={frame}
				editable={editable}
			/>
		)
	} else if (frame.type === 'FOUNDATION') {
		frameInternal = (
			<div
				className={styles.foundationFrame}
				onClick={() => {
					if (editable) {
						navigate(frameURL, { replace: true })
					}
				}}
			>
				<div style={{ flexGrow: 1 }} />
				<div className={styles.foundation} />
				<div style={{ flexGrow: 1 }} />
			</div>
		)
	} else if (frame.type === 'VOID') {
		frameInternal = (
			<div
				onClick={() => {
					if (editable) {
						navigate(frameURL, { replace: true })
					}
				}}
				className={styles.voidFrame}
			/>
		)
	} else if (frame.type === 'PARTITION') {
		frameInternal = (
			<div
				onClick={() => {
					if (editable) {
						navigate(frameURL, { replace: true })
					}
				}}
				className={styles.partition}
			/>
		)
	} else if (frame.type === 'FEEDER') {
		frameInternal = (
			<div
				onClick={() => {
					if (editable) {
						navigate(frameURL, { replace: true })
					}
				}}
				className={styles.feeder}
			/>
		)
	}

	// Render non-visual mode
	return (
		// Added wrapper for relative positioning
		<div
			className={`${styles.frameWrapper} ${
				selectedFrame && styles.frameSelected
			}`}
			data-frame-clickable="true"
			{...dragDropProps}
		>
			<div className={styles.frame}>{frameInternal}</div>
		</div>
	)
}
