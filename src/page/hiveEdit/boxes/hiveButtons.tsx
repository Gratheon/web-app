import { useNavigate } from 'react-router'

import { useMutation } from '@/api'
import Button from '@/shared/button'
import {
	boxTypes,
	addBox,
	maxBoxPosition,
	removeBox
} from '@/models/boxes'
import T from '@/shared/translate'

import AddBoxIcon from '@/icons/addBox'
import AddSuperIcon from '@/icons/addSuper'
import GateIcon from '@/icons/gate'
import ErrorMessage from '@/shared/messageError'

import { useEffect, useState } from 'react'
import metrics from '@/metrics'
import styles from './styles.module.less'
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import DeleteIcon from '@/icons/deleteIcon'
import { useLiveQuery } from 'dexie-react-hooks'
import { getHive, isEditable } from '@/models/hive'
import BulkUploadInline from './box/bulkUploadInline/index'
import { getFrames } from '@/models/frames'
import { enrichFramesWithSides } from '@/models/frameSide'
import { enrichFramesWithSideFiles } from '@/models/frameSideFile'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'
import Modal from '@/shared/modal'

const WAREHOUSE_BY_BOX_TYPE = {
	[boxTypes.DEEP]: 'DEEP',
	[boxTypes.SUPER]: 'SUPER',
	[boxTypes.BOTTOM]: 'BOTTOM',
	[boxTypes.QUEEN_EXCLUDER]: 'QUEEN_EXCLUDER',
	[boxTypes.HORIZONTAL_FEEDER]: 'HORIZONTAL_FEEDER',
}

const WAREHOUSE_BY_FRAME_TYPE = {
	FOUNDATION: 'FRAME_FOUNDATION',
	EMPTY_COMB: 'FRAME_EMPTY_COMB',
	PARTITION: 'FRAME_PARTITION',
	FEEDER: 'FRAME_FEEDER',
}


export default function HiveButtons({
	apiaryId,
	hiveId,
	box,
	frameId
}) {
	let navigate = useNavigate()
	const [adding, setAdding] = useState(false)
	const [errorRemove, setErrorRemove] = useState(false)
	const [removeBoxDialogVisible, setRemoveBoxDialogVisible] = useState(false)
	const { decreaseWarehouseForType, increaseWarehouseForType, increaseWarehouseForTypeBy } = useWarehouseAutoAdjust()
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);

	const frames = useLiveQuery(
		async () => {
			if (!box || !box.id) return null
			const framesWithoutSides = await getFrames({ boxId: box.id })
			if (!framesWithoutSides) return null
			const framesWithSides = await enrichFramesWithSides(framesWithoutSides)
			if (!framesWithSides) return null
			return await enrichFramesWithSideFiles(framesWithSides)
		},
		[box?.id],
		null
	)

	let [addBoxMutation, { error: errorAdd }] =
		useMutation(`mutation addBox($hiveId: ID!, $position: Int!, $type: BoxType!) {
	addBox(hiveId: $hiveId, position: $position, type: $type) {
		id
		position
	}
}
`)

let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
	deactivateBox(id: $id)
}
`)

const [removingBox, setRemovingBox] = useState(false);

	useEffect(() => {
		if (!removeBoxDialogVisible) return

		const onKeyDown = async (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				setRemoveBoxDialogVisible(false)
				return
			}

			if (event.key === 'Enter') {
				event.preventDefault()
				if (!box?.id) return
				await onBoxRemoveChoice('warehouse', +box.id)
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
		}
	}, [removeBoxDialogVisible, box?.id])

	async function onBoxRemoveChoice(mode: 'trash' | 'warehouse', id: number) {
		setRemoveBoxDialogVisible(false)
		setRemovingBox(true)
		const { error } = await removeBoxMutation({ id })

		if (error) {
			setErrorRemove(error)
			setRemovingBox(false)
			return
		}

		const removedBoxType = box?.type
		const boxFrames = (await getFrames({ boxId: id })) || []

		await removeBox(id)

		if (mode === 'warehouse') {
			await increaseWarehouseForType(WAREHOUSE_BY_BOX_TYPE[removedBoxType])

			const frameTypeCounts = boxFrames.reduce<Record<string, number>>((acc, frame) => {
				const key = WAREHOUSE_BY_FRAME_TYPE[frame?.type]
				if (!key) return acc
				acc[key] = (acc[key] || 0) + 1
				return acc
			}, {})

			for (const moduleType of Object.keys(frameTypeCounts)) {
				await increaseWarehouseForTypeBy(moduleType, frameTypeCounts[moduleType])
			}
		}

		setRemovingBox(false)

		metrics.trackBoxRemoved()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/`, {
			replace: true,
		})
	}
	async function onBoxAdd(type) {
		setAdding(true)
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
		await decreaseWarehouseForType(WAREHOUSE_BY_BOX_TYPE[type])

		setAdding(false)

		metrics.trackBoxCreated()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${id}`, {
			replace: true,
		})
	}

	if(hive && !isEditable(hive)){
		return null
	}

	const showBulkUpload = box && (box.type === boxTypes.DEEP || box.type === boxTypes.SUPER) && frames && frames.length > 0 && !frameId

	return (
		<>
			<ErrorMessage error={errorAdd || errorRemove} />

			<div className={styles.hiveButtons}>

				<Button
					title="Add box on top"
					loading={adding}
					color='black'
					onClick={() => onBoxAdd(boxTypes.DEEP)}
				>
					<AddBoxIcon /><span><T ctx="this is a button to add new section of beehive, a deep box that is intended for brood frames">Add deep</T></span>
				</Button>
        <Button
            loading={adding}
            title="Add super on top"
            onClick={() => onBoxAdd(boxTypes.SUPER)}
        >
          <AddSuperIcon /><span><T ctx="this is a button to add new section of beehive, a super box that is intended for honey frames">Add super</T></span>
        </Button>


        <Button
            loading={adding}
            title="Add entrance"
            onClick={() => onBoxAdd(boxTypes.GATE)}
        >
          <GateIcon /><span><T ctx="this is a button to add new section of beehive, specifically holes, an entrance">Add entrance</T></span>
        </Button>

				<PopupButtonGroup>
          <Button
              loading={adding}
              title="Add bottom board"
              onClick={() => onBoxAdd(boxTypes.BOTTOM)}
          ><span><T ctx="this is a button to add bottom board of beehive with slideable white panel for varroa mite counting">Add bottom</T></span>
          </Button>

					<PopupButton>
						<Button
							loading={adding}
							title="Add ventilation"
							onClick={() => onBoxAdd(boxTypes.VENTILATION)}
						><span><T ctx="this is a button to add tiny part of beehive, specifically holes on top for ventilation">Add inner lid</T></span>
						</Button>
						<Button
							loading={adding}
							title="Add queen excluder"
							onClick={() => onBoxAdd(boxTypes.QUEEN_EXCLUDER)}
						><span><T ctx="this is a button to add tiny part of beehive, a horizontal layer that prevents queen bee from moving through this">Add queen excluder</T></span>
						</Button>
						<Button
							loading={adding}
							title="Add feeder"
							onClick={() => onBoxAdd(boxTypes.HORIZONTAL_FEEDER)}
						><span><T ctx="this is a button to add tiny part of beehive, a horizontal box where sugar syrup can be poured to feed bees">Add feeder</T></span>
						</Button>
					</PopupButton>
				</PopupButtonGroup>



        <Button
            color="red"
            loading={removingBox}
            onClick={() => setRemoveBoxDialogVisible(true)}
        ><DeleteIcon /> <T>Remove box</T></Button>
			</div>

			{showBulkUpload && (
				<BulkUploadInline
					hiveId={+hiveId}
					boxId={+box.id}
					apiaryId={+apiaryId}
					frames={frames}
					onComplete={() => {}}
				/>
			)}
			{removeBoxDialogVisible && (
				<Modal
					title={<T>Remove box</T>}
					onClose={() => setRemoveBoxDialogVisible(false)}
				>
					<div style={{ marginBottom: '12px' }}>
						<T>Are you sure you want to remove this box?</T>
					</div>
					<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
						<Button color="gray" onClick={() => setRemoveBoxDialogVisible(false)}>
							<T>Cancel</T>
						</Button>
						<Button
							color="red"
							onClick={async () => {
								if (!box?.id) return
								await onBoxRemoveChoice('trash', +box.id)
							}}
						>
							<T>To trash</T>
						</Button>
						<Button
							color="green"
							onClick={async () => {
								if (!box?.id) return
								await onBoxRemoveChoice('warehouse', +box.id)
							}}
						>
							<T>To warehouse</T>
						</Button>
					</div>
				</Modal>
			)}
		</>
	)
}
