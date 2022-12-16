import React from 'react'

import styles from './index.less'
import FrameSide from './boxFrameHalf'

export default ({
	boxPosition,
	boxSelected,
	frameSelected,
	frameSide,
	apiaryId,
	hiveId,
	frame,
}) => {
	const selectedFrame =
		boxPosition === boxSelected && frame.position === frameSelected

	let frameInternal = null

	// 'VOID','FOUNDATION','EMPTY_COMB','PARTITION','FEEDER'
	if (frame.type === 'VOID') {
		frameInternal = <div className={styles.voidFrame} />
	} else if (frame.type === 'PARTITION') {
		frameInternal = <div className={styles.partition} />
	} else if (frame.type === 'FEEDER') {
		frameInternal = <div className={styles.feeder} />
	} else if (frame.type === 'FOUNDATION') {
		frameInternal = (
			<div style="background-color:#323232;display:flex;flex-grow:1;">
				<div style="flex-grow:1" />
				<div className={styles.foundation} />
				<div style="flex-grow:1" />
			</div>
		)
	} else if (frame.type === 'EMPTY_COMB') {
		frameInternal = (
			<div className={styles.emptyComb}>
				<FrameSide
					className={styles.left}
					href={`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxPosition}/frame/${frame.position}/left`}
					frameSide={frame.leftSide}
				/>

				<div className={styles.foundation} />

				<FrameSide
					className={styles.right}
					href={`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxPosition}/frame/${frame.position}/right`}
					frameSide={frame.rightSide}
				/>
			</div>
		)
	}

	return (
		<div className={`${styles.frame} ${selectedFrame && styles.frameSelected}`}>
			<span
				className={`${styles.position} 
				${selectedFrame && !frameSide && styles.positionSelected}
				${selectedFrame && frameSide === 'left' && styles.positionSelectedLeft}
				${selectedFrame && frameSide === 'right' && styles.positionSelectedRight}
				`}
			>
				{frame.id}
			</span>
			{frameInternal}
		</div>
	)
}
