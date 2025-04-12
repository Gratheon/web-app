import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { Box } from '@/models/boxes.ts';
import { Frame } from '@/models/frames.ts';
import { enrichFramesWithSides } from '@/models/frameSide.ts';
import { getDominantResourceColorForFrameSide } from '@/models/frameSideCells.ts'; // Import new function

import styles from './index.module.less';
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
}: {
	box: Box
	apiaryId: number
	hiveId: number
	frameId: number
	frameSideId: number
	frame: Frame

	editable: boolean // Use primitive boolean type
	displayMode: string
}) {
	if (!frame || !box) return null

	const selectedFrame = frame.id === +frameId
	let frameInternal = null

	let navigate = useNavigate()
	const frameURL = `/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}`

	// Fetch dominant colors for both sides using useLiveQuery
	const leftDominantColor = useLiveQuery(
		() => getDominantResourceColorForFrameSide(frame.leftId),
		[frame.leftId] // Re-run query if leftId changes
	);
	const rightDominantColor = useLiveQuery(
		() => getDominantResourceColorForFrameSide(frame.rightId),
		[frame.rightId] // Re-run query if rightId changes
	);


	if (displayMode == 'visual') {
		if (frame.type === 'FOUNDATION' || frame.type === 'EMPTY_COMB') {
			return (
				<div className={styles.listFrameIcon} style={{ margin: '3px' }}> {/* Fix inline style syntax */}
					<FrameSideImage
						frameSideId={frame.leftId}
						dominantColor={leftDominantColor} // Pass color prop
						frameURL={`${frameURL}/${frame.leftId}`}
						selected={+frameSideId == +frame.leftId}
						editable={editable}
					/>

					<FrameSideImage
						frameSideId={frame.rightId}
						dominantColor={rightDominantColor} // Pass color prop
						frameURL={`${frameURL}/${frame.rightId}`}
						selected={+frameSideId == +frame.rightId}
						editable={editable}
					/>
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

	return (
		<div className={`${styles.frame} ${selectedFrame && styles.frameSelected}`}>
			{frameInternal}
		</div>
	)
}
