import React from 'react'

import styles from './index.less'
import FrameHorizontal from '../frame'

export default function SelectedFrame({
	apiaryId,
	hiveId,
	boxId,
	frameId,

	frameSideId,
}) {
	console.log("SelectedFrame");
	return (
		<div className={styles.selectedFrame}>
			<FrameHorizontal
				apiaryId={apiaryId}
				hiveId={hiveId}
				boxId={boxId}
				frameId={frameId}
				frameSideId={frameSideId}
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
