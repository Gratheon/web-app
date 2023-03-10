import React from 'react'

import styles from './index.less'
import FrameSide from './boxFrameHalf'
import { Box, Frame } from '@/components/api/schema'

type BoxFrameProps = {
	box: Box
	apiaryId: number
	hiveId: number
	boxId: number
	frameId: number
	frameSideId: number
	frame: Frame
}

export default function BoxFrame({
	box,
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,
	frame
}: BoxFrameProps) {
	const selectedFrame = frame.id === +frameId

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
			<div style={{ backgroundColor: '#323232', display: 'flex', flexGrow: 1 }}>
				<div style={{ flexGrow: 1 }} />
				<div className={styles.foundation} />
				<div style={{ flexGrow: 1 }} />
			</div>
		)
	} else if (frame.type === 'EMPTY_COMB') {
		frameInternal = (
			<div className={styles.emptyComb}>
				<FrameSide
					className={styles.left}
					href={`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}/${frame.leftId}`}
					frameSide={frame.leftSide}
				/>

				<div className={styles.foundation} />

				<FrameSide
					className={styles.right}
					href={`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}/${frame.rightId}`}
					frameSide={frame.rightSide}
				/>
			</div>
		)
	}

	return (
		<div className={`${styles.frame} ${selectedFrame && styles.frameSelected}`}>
			<span
				className={`${styles.position} 
				${selectedFrame && !frameSideId && styles.positionSelected}
				${selectedFrame && +frameSideId === frame.leftId && styles.positionSelectedLeft}
				${selectedFrame && +frameSideId === frame.rightId && styles.positionSelectedRight}
				`}
			>
				{frame.id}
			</span>
			{frameInternal}
		</div>
	)
}
