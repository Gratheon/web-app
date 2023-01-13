import { useNavigate } from 'react-router'

import Box from './box'
// import { isFrameWithSides } from '@/components/models/frames'
import { useMutation } from '@/components/api'
import Button from '@/components/shared/button'
import {
	boxTypes,
	addBox,
	maxBoxPosition
} from '@/components/models/boxes'
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
	onError,
}: BoxesProps) {
	let [addBoxMutation] =
		useMutation(`mutation addBox($hiveId: ID!, $position: Int!, $type: BoxType!) {
	addBox(hiveId: $hiveId, position: $position, type: $type) {
		id
		position
	}
}
`)
	async function onBoxAdd(type) {
		let position = (await maxBoxPosition(+hiveId)) + 1

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

		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${id}`, {
			replace: true,
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

	for (let box of boxes) {
		const currentBoxSelected = box.id === parseInt(boxId, 10)

		boxesDivs.push(
			<div
				style={{ marginBottom: 15 }}
				onClick={(event) => {
					onBoxClick({ event, boxId: box.id })
				}}
			>
				{currentBoxSelected && (
					<div style={{ height: 35 }}>
						<FrameButtons onError={onError} box={box} />
					</div>
				)}

				<div className={styles.box}>
					<Box
						box={box}
						boxId={boxId}
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
			<div style={{ display: 'flex', marginBottom:1  }}>
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
			<div>{boxesDivs}</div>
		</div>
	)
}
