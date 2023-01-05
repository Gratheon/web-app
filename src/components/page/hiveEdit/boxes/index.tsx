import find from 'lodash/find'
import filter from 'lodash/filter'
import isNil from 'lodash/isNil'
import { useNavigate } from 'react-router'

import Box from './box'
import { isFrameWithSides } from '../../../models/frames'
import { useMutation } from '../../../api'

import SelectedFrame from './selectedFrame'
import FrameButtons from './box/frameButtons'
import Button from '../../../shared/button'
import styles from './styles.less'

import { boxTypes, addBox, countHiveBoxes } from '../../../models/boxes'
import AddBoxIcon from '../../../../icons/addBox'

type BoxesProps = {
	hiveId: any
	boxes: any
	apiaryId: any
	boxId: any
	frameId: any
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

	onError: any
}

export default function Boxes({
	hiveId,
	boxes,
	apiaryId,
	boxId,
	frameId,
	frameSide,
	onError
}: BoxesProps) {
	let [addBoxMutation] =
		useMutation(`mutation addBox($hiveId: ID!, $position: Int!, $type: BoxType!) {
	addBox(hiveId: $hiveId, position: $position, type: $type) {
		id
	}
}
`)

	function onMoveDown(index) {
		// if (moveBoxDown({ hiveId: +hive.id, index })) {
		// 	swapBox({
		// 		hiveId: +hive.id,
		// 		boxIndex: index,
		// 		toBoxIndex: index - 1,
		// 	})
		// }
	}

	async function onBoxAdd(type) {
		const position = (await countHiveBoxes(+hiveId)) + 1

		const {
			data: {
				addBox: { id },
			},
		} = await addBoxMutation({
			hiveId: +hiveId,
			position,
			type,
		})

		await addBox({
			id: +id,
			hiveId: +hiveId,
			position,
			type,
		})
	}

	function onFrameClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, { replace: true })
	}

	let navigate = useNavigate()
	function onBoxClick({ event, boxId }) {
		// match only background div to consider it as a selection to avoid overriding redirect to frame click
		if (
			typeof event.target.className === 'string' &&
			event.target.className.indexOf('boxInner') === 0
		) {
			event.stopPropagation()
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
				replace: true,
			})
		}
	}

	const boxesDivs = []

	for (
		let boxDivPosition = 0;
		boxDivPosition < boxes.length;
		boxDivPosition++
	) {
		const box = boxes[boxDivPosition]
		const currentBoxSelected = box.id === parseInt(boxId, 10)
		const showDownButton = boxes.length - 1 !== boxDivPosition


		boxesDivs.push(
			<div
				style={{ marginBottom: 15 }}
				onClick={(event) => {
					onBoxClick({ event, boxId: box.id })
				}}
			>
				{currentBoxSelected && (
					<div style={{ height: 35 }}>
						<FrameButtons
							onError={onError}
							frameId={frameId}
							showDownButton={showDownButton}
							box={box}
						/>
					</div>
				)}

				<div className={styles.box}>
					<Box
						boxType={box.type}
						boxPosition={box.position}
						boxId={box.id}
						frameId={frameId}
						frameSide={frameSide}
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

			<SelectedFrame
				boxId={boxId}
				frameId={frameId}
				hiveId={hiveId}
				frameSide={frameSide}
				/>
		</div>
	)
}
