import find from 'lodash/find'
import filter from 'lodash/filter'
import isNil from 'lodash/isNil'
import { useNavigate } from 'react-router'

import Box from './box'
import { isFrameWithSides } from '../../../models/frames'

import SelectedFrame from './selectedFrame'
import FrameButtons from './box/frameButtons'
import Button from '../../../shared/button'
import styles from './styles.less'

import { boxTypes } from '../../../models/boxes'
import AddBoxIcon from '../../../../icons/addBox'

type BoxesProps = {
	hiveId: any
	frames: any
	boxes: any
	apiaryId: any
	boxSelected: any
	frameSelected: any
	frameSide: any

	editable?: boolean

	onBoxClick?: any
	onBoxRemove?: any
	onBoxAdd?: any
	onMoveDown?: any

	onFrameClose?: any
	onFrameAdd?: any
	onFrameSideFileUpload?: any
	onDragDropFrame?: any
	onFrameSideStatChange?: any
	onFrameRemove?: any
}

export default function Boxes({
	hiveId,
	frames,
	boxes,
	apiaryId,
	boxSelected,
	frameSelected = 0,
	frameSide,
}: BoxesProps) {

	//todo
	function onBoxRemove(position) {
		// removeAllFromBox({ hiveId: +hive.id, boxIndex: position })

		// const boxes = getBoxes({ hiveId: +hive.id })

		// removeBox({ hiveId: +hive.id, position })

		// map(boxes, (v: Box) => {
		// 	if (v.position >= position) {
		// 		moveFramesToBox({
		// 			hiveId: +hive.id,
		// 			boxIndex: v.position + 1,
		// 			toBoxIndex: v.position,
		// 		})
		// 	}
		// })
	}

	function onMoveDown(index) {
		// if (moveBoxDown({ hiveId: +hive.id, index })) {
		// 	swapBox({
		// 		hiveId: +hive.id,
		// 		boxIndex: index,
		// 		toBoxIndex: index - 1,
		// 	})
		// }
	}

	function onBoxAdd(boxType) {
		// addBox({ hiveId: +hive.id, boxType })
	}

	// frames
	function onFrameRemove(boxIndex, framePosition) {
		// removeFrame({
		// 	hiveId: +hive.id,
		// 	boxIndex,
		// 	framePosition,
		// })
	}

	function onFrameClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, { replace: true })
	}

	function onFrameSideStatChange(boxIndex, position, side, prop, value) {
		// setFrameSideProperty({
		// 	hiveId: +hiveId,
		// 	boxIndex,
		// 	position,
		// 	side: side === 'left' ? 'leftSide' : 'rightSide',
		// 	prop,
		// 	value,
		// })
	}

	function onFrameSideFileUpload({ boxIndex, position, side, uploadedFile }) {
		// setFrameSideFile({
		// 	hiveId: +hiveId,
		// 	boxIndex,
		// 	position,
		// 	side,
		// 	uploadedFile,
		// })
	}

	let navigate = useNavigate()
	function onBoxClick({ event, boxIndex }) {
		// match only background div to consider it as a selection to avoid overriding redirect to frame click
		if (
			typeof event.target.className === 'string' &&
			event.target.className.indexOf('boxInner') === 0
		) {
			event.stopPropagation()
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxIndex}`, {
				replace: true,
			})
		}
	}


	const boxesDivs = []
	let selectedFrameSide = null

	for (
		let boxDivPosition = 0;
		boxDivPosition < boxes.length;
		boxDivPosition++
	) {
		const box = boxes[boxDivPosition]
		const currentBoxSelected = box.position === parseInt(boxSelected, 10)
		const showDownButton = boxes.length - 1 !== boxDivPosition
		const boxFrames = filter(frames, { boxIndex: box.position })

		if (!isNil(frameSelected) && !isNil(boxSelected)) {
			const selectedFrame = find(frames, {
				position: parseInt(frameSelected, 10),
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
				const onUpload = (uploadedFile: any) => {
					// TODO
					console.log('todo',{
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
				style={{ marginBottom: 15 }}
				onClick={(event) => {
					onBoxClick({ event, boxIndex: box.position })
				}}
			>
				{currentBoxSelected && (
					<div style={{ height: 35 }}>
						<FrameButtons
							frameSelected={frameSelected}
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
						frameSelected={frameSelected}
						frameSide={frameSide}
						frames={boxFrames}
						hiveId={hiveId}
						apiaryId={apiaryId}
					/>
				</div>
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', padding: '0 20px' }}>
			<div style={{ paddingRight: 5, overflow: 'hidden', flexGrow: 3 }}>
				<div style={{ display: 'flex', height: 40 }}>
					<h3 style={{ flexGrow: 1 }}>Hive sections</h3>

					<div style={{ display: 'flex' }}>
						<Button
							title="Add box on top"
							className={['small', 'black']}
							onClick={() => onBoxAdd(boxTypes.DEEP)}>
							<AddBoxIcon /> Add deep
						</Button>
						<Button
							title="Add box on top"
							onClick={() => onBoxAdd(boxTypes.SUPER)}>
							<AddBoxIcon /> Add super
						</Button>
					</div>
				</div>

				<div>{boxesDivs}</div>
			</div>

			{selectedFrameSide}
		</div>
	)
}
