import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'

// import { isFrameWithSides } from '@/components/models/frames'
import { useMutation } from '@/components/api'
import Button from '@/components/shared/button'
import {
	boxTypes,
	getBoxes,
	addBox,
	maxBoxPosition
} from '@/components/models/boxes'

import { useQuery } from '@/components/api'

import AddBoxIcon from '@/icons/addBox'
import AddSuperIcon from '@/icons/addSuper'
import GateIcon from '@/icons/gate'
import ErrorMessage from '@/components/shared/messageError'
import Loader from '@/components/shared/loader'

import Gate from './gate'
import Box from './box'
import FrameButtons from './box/frameButtons'
import BoxButtons from './box/boxButtons'
import styles from './styles.less'

import BOXES_QUERY from './boxesQuery.graphql'

type BoxesProps = {
	hiveId: any
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

	onError: any
}

export default function Boxes({
	hiveId,
	apiaryId,
	boxId,
	frameId,
	frameSideId,
	onError,
}: BoxesProps) {

	const boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId], null)

	if (boxes == null) {
		return <Loader />
	}

	if (!boxes) {
		useQuery(BOXES_QUERY, { variables: { id: +hiveId, apiaryId: +apiaryId } })
	}

	let [addBoxMutation, { error }] =
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
			(
				event.target.className.indexOf('gate') === 0 ||
				event.target.className.indexOf('box') === 0
			)
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
				onClick={(event) => {
					onBoxClick({ event, boxId: box.id })
				}}
			>
				{currentBoxSelected && (
					<div style={{ height: 35, display: 'flex' }}>
						{box.type != boxTypes.GATE &&
							<FrameButtons box={box} onError={onError} />
						}
						<BoxButtons onError={onError} box={box} />
					</div>
				)}
				<div className={styles.box + ` boxOuterClick`}>
					{box.type != boxTypes.GATE &&
						<Box
							box={box}
							boxId={boxId}
							frameId={frameId}
							frameSideId={frameSideId}
							hiveId={hiveId}
							apiaryId={apiaryId}
						/>
					}

					{box.type == boxTypes.GATE && <Gate />}
				</div>
			</div>
		)
	}

	return (
		<div>
			<ErrorMessage error={error} />
			<div style={{ display: 'flex', marginBottom: 1 }}>
				<Button
					title="Add box on top"
					className={['small', 'black']}
					onClick={() => onBoxAdd(boxTypes.DEEP)}
				>
					<AddBoxIcon /> Add deep
				</Button>
				<Button
					title="Add super on top"
					onClick={() => onBoxAdd(boxTypes.SUPER)}
				>
					<AddSuperIcon /> Add super
				</Button>
				<Button
					title="Add gate"
					onClick={() => onBoxAdd(boxTypes.GATE)}
				>
					<GateIcon /> Add gate
				</Button>
			</div>
			<div>{boxesDivs}</div>
		</div>
	)
}
