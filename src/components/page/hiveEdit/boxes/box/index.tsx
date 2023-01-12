import React from 'react'
import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from "dexie-react-hooks";

import { getFrames } from '@/components/models/frames'
import CrownIcon from '@/icons/crownIcon'
import { isFrameWithSides } from '@/components/models/frames'

import styles from './index.less'
import Frame from './boxFrame'

export default ({
	box,
	boxId,
	frameId,
	frameSideId,
	apiaryId,
	hiveId,
}) => {
	const navigate = useNavigate();
	const framesDiv = []

	const frames = useLiveQuery(() => getFrames({
		boxId: box.id
	}), [boxId]);

	if (!isNil(frames)) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			framesDiv.push(
				</* @ts-ignore */ Draggable key={i}>
					<div style={{ textAlign: 'center', height: 20 }}>
						{isFrameWithSides(frame.type) && (
							<CrownIcon
								fill={frame.leftSide?.queenDetected ? 'white' : '#444444'}
							/>
						)}
						{isFrameWithSides(frame.type) && (
							<CrownIcon
								fill={frame.rightSide?.queenDetected ? 'white' : '#444444'}
							/>
						)}
					</div>

					<Frame
						box={box}
						boxId={boxId}
						frameId={frameId}
						frameSideId={frameSideId}
						
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
			className={`${styles['boxType_' + box.type]} ${styles.boxOuter} ${
				+boxId === box.id && styles.selected
			}`}
		>
			<div className={styles.boxInner}>
				{/* @ts-ignore */}
				<Container
					style={{ height: `calc(100% - 30px)` }}
					onDrop={()=>{
						if (!isNil(frameSideId)) {
							navigate(
								`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frameId}/${frameSideId}`,
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
