import React from 'react'

import styles from './index.less'
import FrameSide from './boxFrameHalf'
import { Box, Frame } from '@/components/api/schema'
import { useNavigate } from 'react-router-dom'

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
	let navigate = useNavigate()

	let frameInternal = null
	const frameURL = `/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}`

	if (frame.type === 'VOID') {
		frameInternal = <div onClick={() => { navigate(frameURL, { replace: true }) }} className={styles.voidFrame} />
	} else if (frame.type === 'PARTITION') {
		frameInternal = <div onClick={() => { navigate(frameURL, { replace: true }) }} className={styles.partition} />
	} else if (frame.type === 'FEEDER') {
		frameInternal = <div onClick={() => { navigate(frameURL, { replace: true }) }} className={styles.feeder} />
	} else if (frame.type === 'FOUNDATION') {
		frameInternal = (
			<div className={styles.foundationFrame} onClick={() => { navigate(frameURL, { replace: true }) }}>
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
					href={`${frameURL}/${frame.leftId}`}
					frameSide={frame.leftSide}
				/>

				<div className={styles.foundation} />

				<FrameSide
					className={styles.right}
					href={`${frameURL}/${frame.rightId}`}
					frameSide={frame.rightSide}
				/>
			</div>
		)
	}

	return (
		<>
			<div style={{ textAlign: 'center', height: 40 }}>
				<span
					className={`${styles.position} 
					${selectedFrame && !frameSideId && styles.positionSelected}
					${selectedFrame && +frameSideId === frame.leftId && styles.positionSelectedLeft}
					${selectedFrame && +frameSideId === frame.rightId && styles.positionSelectedRight}
					`}
				>
					{frame.id}
				</span>
			</div>
			<div className={`${styles.frame} ${selectedFrame && styles.frameSelected}`}>
				{frameInternal}
			</div>
		</>
	)
}
