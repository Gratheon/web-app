import React from 'react'

import styles from './index.less'
import FrameHorizontal from '../frame'

export default ({
	boxSelected,
	frameSelected,
	box,
	hiveId,
	selectedFrame,
	frameWithSides,
	frameSide,
	frameSideObject,
	onUpload,
	onFrameClose,
	onFrameSideStatChange,
}) => {
	return (
		<div className={styles.selectedFrame}>
			{frameWithSides && (
				<FrameHorizontal
					hiveId={hiveId}
					frameSideId={frameSideObject.id}
					onUpload={onUpload}
					onFrameSideStatChange={(key, value) =>
						onFrameSideStatChange(
							boxSelected,
							frameSelected,
							frameSide,
							key,
							value
						)
					}
					frameSide={frameSideObject}
					onQueenToggle={() => {
						onFrameSideStatChange(
							box.position,
							selectedFrame.position,
							frameSide,
							'queenDetected',
							!frameSideObject.queenDetected
						)
					}}
					onFrameClose={onFrameClose}
				/>
			)}
		</div>
	)
}
