import find from 'lodash/find'
import filter from 'lodash/filter'
import isNil from 'lodash/isNil'

import Box from './box'
import { isFrameWithSides } from '../../../../storage/frames'

import SelectedFrame from './selectedFrame'
import FrameButtons from './box/frameButtons'
import Button from '../../../shared/button'
import styles from './index.less'
import React from 'preact/compat'
import { boxTypes } from '../../../../storage/boxes'
import AddBoxIcon from '../../../../icons/addBox'
import { PopupButtonGroup } from '../../../shared/popupButton'
import ListInspections from '../../../shared/listInspections'

export default ({
	hive,
	hiveId,
	frames,
	boxes,
	apiaryId,
	boxSelected,
	frameSelected = 0,
	frameSide,

	editable = true,
	onNotesChange,

	onBoxClick = () => {},
	onBoxRemove = () => {},
	onBoxAdd = () => {},
	onMoveDown = () => {},

	onFrameClose = () => {},
	onFrameAdd = () => {},
	onFrameSideFileUpload = () => {},
	onDragDropFrame = () => {},
	onFrameSideStatChange = () => {},
	onFrameRemove = () => {},
}) => {
	const boxesDivs = []
	let selectedFrameSide = null

	for (
		let boxDivPosition = 0;
		boxDivPosition < boxes.length;
		boxDivPosition++
	) {
		const box = boxes[boxDivPosition]
		const currentBoxSelected = !editable || box.position === boxSelected
		const showDownButton = boxes.length - 1 !== boxDivPosition
		const boxFrames = filter(frames, { boxIndex: box.position })

		if (editable && !isNil(frameSelected) && !isNil(boxSelected)) {
			const selectedFrame = find(frames, {
				position: frameSelected,
				boxIndex: box.position,
			})
			const frameWithSides =
				!isNil(frameSide) &&
				selectedFrame &&
				isFrameWithSides(selectedFrame.type)
			const frameSideObject = frameWithSides
				? frameSide === 'left'
					? selectedFrame.leftSide
					: selectedFrame.rightSide
				: null

			if (currentBoxSelected && selectedFrame) {
				const onUpload = (uploadedFile) => {
					onFrameSideFileUpload({
						boxIndex: box.position,
						position: selectedFrame.position,
						side: frameSide,
						uploadedFile,
					})
				}

				selectedFrameSide = (
					<SelectedFrame
						boxSelected={boxSelected}
						frameSelected={frameSelected}
						box={box}
						hiveId={hiveId}
						selectedFrame={selectedFrame}
						frameWithSides={frameWithSides}
						frameSide={frameSide}
						frameSideObject={frameSideObject}
						onUpload={onUpload}
						onFrameClose={onFrameClose}
						onFrameSideStatChange={onFrameSideStatChange}
					/>
				)
			}
		}

		boxesDivs.push(
			<div
				style="margin-bottom:15px;"
				onClick={(event) => {
					onBoxClick({ event, boxIndex: box.position })
				}}
			>
				{editable && currentBoxSelected && (
					<div style="height: 35px">
						<FrameButtons
							frameSelected={frameSelected}
							onFrameRemove={onFrameRemove}
							onBoxAdd={onBoxAdd}
							onMoveDown={onMoveDown}
							onBoxRemove={onBoxRemove}
							onFrameAdd={onFrameAdd}
							showDownButton={showDownButton}
							box={box}
						/>
					</div>
				)}

				<div className={styles.box}>
					<Box
						boxType={box.type}
						boxPosition={box.position}
						boxSelected={boxSelected}
						editable={editable}
						frameSelected={frameSelected}
						frameSide={frameSide}
						frames={boxFrames}
						hiveId={hiveId}
						apiaryId={apiaryId}
						onDragDropFrame={(args) => {
							const { removedIndex, addedIndex, event } = args

							onDragDropFrame({
								event,
								onDragDropFrame,
								removedIndex,
								addedIndex,
								hiveId,
								frameSide,
								boxIndex: boxSelected,
							})
						}}
						onFrameAdd={() => onFrameAdd(box.position)}
					/>
				</div>
			</div>
		)
	}

	return (
		<div style="display:flex;padding:0 20px;">
			<div style="padding-right: 5px;overflow:hidden;flex-grow:3">
				<div style="display:flex;height:40px;">
					<h3 style="flex-grow:1">Hive sections</h3>

					<div style="display:flex;">
						<Button
							title="Add box on top"
							className={['small', 'black']}
							onClick={() => onBoxAdd(boxTypes.DEEP)}
						>
							<AddBoxIcon /> Add deep
						</Button>
						<Button
							title="Add box on top"
							onClick={() => onBoxAdd(boxTypes.SUPER)}
						>
							<AddBoxIcon /> Add super
						</Button>
					</div>
				</div>

				<div>{boxesDivs}</div>
			</div>

			{selectedFrameSide}

			{/* Notes */}
			{!selectedFrameSide && (
				<div style="flex-grow:6">
					<ListInspections
						apiaryId={apiaryId}
						inspections={hive.inspections}
						hive={hive}
					/>
				</div>
			)}
		</div>
	)
}
