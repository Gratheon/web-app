import { useNavigate } from 'react-router'

import Box from './box'
// import { isFrameWithSides } from '@/components/models/frames'
import { useMutation } from '@/components/api'
import Button from '@/components/shared/button'
import { boxTypes, addBox, countHiveBoxes } from '@/components/models/boxes'
import AddBoxIcon from '@/icons/addBox'

import FrameButtons from './box/frameButtons'
import styles from './styles.less'

type BoxesProps = {
	hiveId: any
	boxes: any
	apiaryId: any
	boxId: any
	frameId: any
	frameSideId: any

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
	frameSideId,
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
		// todo
		console.log('on move down', index);
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
						frameSideId={frameSideId}
						hiveId={hiveId}
						apiaryId={apiaryId}
					/>
				</div>
			</div>
		)
	}

	return (
		
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
	)
}
