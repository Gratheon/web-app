import React from 'react'
import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'

import styles from './index.less'
import Frame from './boxFrame'
import CrownIcon from '../../../../../icons/crownIcon'
import { isFrameWithSides } from '../../../../api/storage/frames'

export default ({
	frames,
	editable = true,
	boxType,
	boxPosition,
	boxSelected,
	frameSelected,
	frameSide,
	onDragDropFrame,
	apiaryId,
	hiveId,
}) => {
	const framesDiv = []

	if (!isNil(frames)) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			if (editable) {
				framesDiv.push(
					</* @ts-ignore */
					Draggable key={i}>
						<div style={{textAlign:'center', height:20}}>
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
			} else {
				framesDiv.push(
					<div key={i} className={styles.frameOuter}>
						<div style={{textAlign:'center', height:20}}>
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
					</div>
				)
			}
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
					onDrop={onDragDropFrame}
					orientation="horizontal"
				>
					{framesDiv}
				</Container>
			</div>
		</div>
	)
}
