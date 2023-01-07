import React from 'react'

import styles from './index.less'
import FrameHorizontal from '../frame'

export default ({
	hiveId,
	boxId,
	frameId,

	// frameWithSides,
	frameSide,
	// frameSideObject,
	// onUpload,
	// onFrameClose,
}) => {
	return (
		<div className={styles.selectedFrame}>
			<FrameHorizontal
				hiveId={hiveId}
				boxId={boxId}
				frameId={frameId}
				frameSide={frameSide}
				// onFrameSideStatChange={(key, value) => true
					// onFrameSideStatChange(
					// 	boxSelected,
					// 	frameSelected,
					// 	frameSide,
					// 	key,
					// 	value
					// )
				// }
				// onQueenToggle={() => {
					// onFrameSideStatChange(
					// 	box.position,
					// 	selectedFrame.position,
					// 	frameSide,
					// 	'queenDetected',
					// 	!frameSideObject.queenDetected
					// )
				// }}
				// onFrameClose={onFrameClose}
			/>
		</div>
	)
}
