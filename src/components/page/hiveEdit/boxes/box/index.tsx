import React from 'react'
import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'
import { useNavigate } from 'react-router-dom'


import styles from './index.less'
import Frame from './boxFrame'
import CrownIcon from '../../../../../icons/crownIcon'
import { isFrameWithSides } from '../../../../models/frames'

export default ({
	frames,
	boxType,
	boxPosition,
	boxSelected,
	frameSelected,
	frameSide,
	apiaryId,
	hiveId,
}) => {
	const navigate = useNavigate();
	const framesDiv = []

	if (!isNil(frames)) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			framesDiv.push(
				</* @ts-ignore */ Draggable key={i}>
					<div style={{ textAlign: 'center', height: 20 }}>
						{isFrameWithSides(frame.type) && (
							<CrownIcon
								fill={frame.leftSide.queenDetected ? 'white' : '#444444'}
							/>
						)}
						{isFrameWithSides(frame.type) && (
							<CrownIcon
								fill={frame.rightSide.queenDetected ? 'white' : '#444444'}
							/>
						)}
					</div>

					<Frame
						boxSelected={boxSelected}
						frameSelected={frameSelected}
						frameSide={frameSide}
						boxPosition={boxPosition}
						hiveId={hiveId}
						apiaryId={apiaryId}
						frame={frame}
					/>
				</Draggable>
			)
		}
	}

	return (
		<div
			className={`${styles['boxType_' + boxType]} ${styles.boxOuter} ${
				boxSelected === boxPosition && styles.selected
			}`}
		>
			<div className={styles.boxInner}>
				{/* @ts-ignore */}
				<Container
					style={{ height: `calc(100% - 30px)` }}
					onDrop={()=>{
						if (!isNil(frameSide)) {
							// event.stopPropagation()
							navigate(
								`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxSelected}/frame/${frameSelected}/${frameSide}`,
								{ replace: true }
							)
						}
					}}
					orientation="horizontal"
				>
					{framesDiv}
				</Container>
			</div>
		</div>
	)
}
