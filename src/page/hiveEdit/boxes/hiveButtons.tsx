import { useNavigate } from 'react-router'

import { useMutation } from '@/api'
import Button from '@/shared/button'
import {
	boxTypes,
	addBox,
	getBoxes,
	removeBox,
	swapBoxPositions,
	GATE_HOLE_COUNT_DEFAULT,
	roofStyles,
} from '@/models/boxes'
import T, { useTranslation as t } from '@/shared/translate'

import AddBoxIcon from '@/icons/addBox'
import AddSuperIcon from '@/icons/addSuper'
import GateIcon from '@/icons/gate'
import ErrorMessage from '@/shared/messageError'

import { useEffect, useState } from 'react'
import metrics from '@/metrics'
import styles from './styles.module.less'
import DeleteIcon from '@/icons/deleteIcon'
import { useLiveQuery } from 'dexie-react-hooks'
import { getHive, isEditable } from '@/models/hive'
import BulkUploadInline from './box/bulkUploadInline/index'
import { getFrames } from '@/models/frames'
import { enrichFramesWithSides } from '@/models/frameSide'
import { enrichFramesWithSideFiles } from '@/models/frameSideFile'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'
import Modal from '@/shared/modal'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'

const WAREHOUSE_BY_BOX_TYPE = {
	[boxTypes.DEEP]: 'DEEP',
	[boxTypes.SUPER]: 'SUPER',
	[boxTypes.LARGE_HORIZONTAL_SECTION]: 'LARGE_HORIZONTAL_SECTION',
	[boxTypes.ROOF]: 'ROOF',
	[boxTypes.BOTTOM]: 'BOTTOM',
	[boxTypes.QUEEN_EXCLUDER]: 'QUEEN_EXCLUDER',
	[boxTypes.HORIZONTAL_FEEDER]: 'HORIZONTAL_FEEDER',
}

function resolveWarehouseModuleTypeForBox(boxType: string, hiveType?: string | null) {
	if (boxType === boxTypes.DEEP && String(hiveType || '').toUpperCase() === 'NUCLEUS') {
		return 'NUCS'
	}
	return WAREHOUSE_BY_BOX_TYPE[boxType]
}

export default function HiveButtons({
	apiaryId,
	hiveId,
	box,
	frameId,
	mode = 'all',
	openRemoveDialogSignal = 0,
	onRemoveDialogSignalConsumed = () => {},
}) {
	const tSectionRemoved = t('Section removed')
	const tSectionAdded = t('Section added')
	let navigate = useNavigate()
	const [adding, setAdding] = useState(false)
	const [errorRemove, setErrorRemove] = useState(false)
	const [removeBoxDialogVisible, setRemoveBoxDialogVisible] = useState(false)
	const { decreaseWarehouseForType, increaseWarehouseForType, increaseWarehouseForFrameByFrameId } = useWarehouseAutoAdjust()
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
		useMutation(`mutation addBox($hiveId: ID!, $position: Int!, $type: BoxType!, $holeCount: Int) {
	addBox(hiveId: $hiveId, position: $position, type: $type, holeCount: $holeCount) {
		id
		position
		holeCount
		roofStyle
	}
}
`)

let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
	deactivateBox(id: $id)
}
`)

let [swapBoxPositionsMutation, { error: errorSwap }] = useMutation(
	`mutation swapBoxPositions($id: ID!, $id2: ID!) {swapBoxPositions(id: $id, id2: $id2)}`
)

const [removingBox, setRemovingBox] = useState(false);

	useEffect(() => {
		if (!removeBoxDialogVisible) return

		const onKeyDown = async (event: KeyboardEvent) => {
			if (removingBox) return

			if (event.key === 'Escape') {
				event.preventDefault()
				event.stopPropagation()
				setRemoveBoxDialogVisible(false)
				return
			}

			if (event.key === 'Enter') {
				event.preventDefault()
				event.stopPropagation()
				if (!box?.id) return
				await onBoxRemoveChoice('warehouse', +box.id)
			}
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
		}
	}, [removeBoxDialogVisible, box?.id, removingBox])

	useEffect(() => {
		if (!openRemoveDialogSignal) return
		if (!box?.id || removingBox || removeBoxDialogVisible) return
		setRemoveBoxDialogVisible(true)
		onRemoveDialogSignalConsumed()
	}, [
		openRemoveDialogSignal,
		box?.id,
		removingBox,
		removeBoxDialogVisible,
		onRemoveDialogSignalConsumed,
	])

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
		await addHiveLog({
			hiveId: +hiveId,
			action: hiveLogActions.STRUCTURE_REMOVE,
			title: tSectionRemoved,
			details: `Removed ${removedBoxType || 'section'} #${id}.`,
		})

		if (mode === 'warehouse') {
			const moduleType = resolveWarehouseModuleTypeForBox(removedBoxType, hive?.hiveType)
			await increaseWarehouseForType(moduleType === 'NUCS' ? 'NUCS' : moduleType)
			for (const frame of boxFrames) {
				if (!frame?.id) continue
				await increaseWarehouseForFrameByFrameId(frame.id)
			}
		}

		setRemovingBox(false)

		metrics.trackBoxRemoved()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/`, {
			replace: true,
		})
	}
	async function onBoxAdd(type, placement: 'top' | 'bottom' | 'underRoof' = 'top') {
		setAdding(true)
		const hiveBoxes = await getBoxes({ hiveId: +hiveId })
		const positions = hiveBoxes.map((hiveBox) => hiveBox.position)
		const maxPosition = positions.length > 0 ? Math.max(...positions) : 0
		const minPosition = positions.length > 0 ? Math.min(...positions) : 0
		const bottomBoardBox = hiveBoxes
			.filter((hiveBox) => hiveBox.type === boxTypes.BOTTOM)
			.sort((a, b) => a.position - b.position)[0]
		const topRoofBox = hiveBoxes
			.filter((hiveBox) => hiveBox.type === boxTypes.ROOF)
			.sort((a, b) => b.position - a.position)[0]
		const shouldPlaceUnderRoof = placement === 'underRoof' && topRoofBox
		const shouldPlaceGateBeforeBottom = type === boxTypes.GATE && placement === 'bottom' && bottomBoardBox
		const position = placement === 'bottom'
			? minPosition - 1
			: maxPosition + 1

		const {
			data: {
				addBox: { id },
			},
		} = await addBoxMutation({
			hiveId: +hiveId,
			position,
			type,
			holeCount: type === boxTypes.GATE ? GATE_HOLE_COUNT_DEFAULT : null,
		})

		await addBox({
			id: +id,
			hiveId: +hiveId,
			position,
			type,
			holeCount: type === boxTypes.GATE ? GATE_HOLE_COUNT_DEFAULT : undefined,
			roofStyle: type === boxTypes.ROOF ? roofStyles.FLAT : undefined,
		})

		let finalPosition = position
		if (shouldPlaceGateBeforeBottom) {
			const { error } = await swapBoxPositionsMutation({
				id: +id,
				id2: +bottomBoardBox.id,
			})
			if (error) {
				setAdding(false)
				return
			}
			await swapBoxPositions(
				{
					id: +id,
					hiveId: +hiveId,
					position,
					type,
					holeCount: type === boxTypes.GATE ? GATE_HOLE_COUNT_DEFAULT : undefined,
				},
				{ ...bottomBoardBox }
			)
			finalPosition = +bottomBoardBox.position
		}
		if (shouldPlaceUnderRoof) {
			const { error } = await swapBoxPositionsMutation({
				id: +id,
				id2: +topRoofBox.id,
			})
			if (error) {
				setAdding(false)
				return
			}
			await swapBoxPositions(
				{
					id: +id,
					hiveId: +hiveId,
					position,
					type,
					holeCount: type === boxTypes.GATE ? GATE_HOLE_COUNT_DEFAULT : undefined,
				},
				{ ...topRoofBox }
			)
			finalPosition = +topRoofBox.position
		}

		await addHiveLog({
			hiveId: +hiveId,
			action: hiveLogActions.STRUCTURE_ADD,
			title: tSectionAdded,
			details: `Added ${type} at position ${finalPosition}.`,
		})
		const moduleType = resolveWarehouseModuleTypeForBox(type, hive?.hiveType)
		await decreaseWarehouseForType(moduleType)

		setAdding(false)

		metrics.trackBoxCreated()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${id}`, {
			replace: true,
		})
	}

	if(hive && !isEditable(hive)){
		return null
	}

	const showBulkUpload = mode !== 'removeOnly' && box && (
		box.type === boxTypes.DEEP ||
		box.type === boxTypes.SUPER ||
		box.type === boxTypes.LARGE_HORIZONTAL_SECTION
	) && frames && frames.length > 0 && !frameId
	const isNucleusHive = String(hive?.hiveType || '').toUpperCase() === 'NUCLEUS'
	const showAddSectionButtons = mode !== 'removeOnly' && !box?.id && !isNucleusHive
	const showRemoveButton = mode !== 'nonRemove' && box?.id
	const buttonGroupClassName = mode === 'removeOnly'
		? `${styles.hiveButtons} ${styles.removeOnlyGroup}`
		: styles.hiveButtons

	return (
		<>
			<ErrorMessage error={errorAdd || errorSwap || errorRemove} />

			{(showAddSectionButtons || showRemoveButton) && (
				<div className={buttonGroupClassName}>
					{showAddSectionButtons && (
					<>
						<Button
							className={styles.actionButton}
							loading={adding}
							color="white"
							title="Add roof"
							onClick={() => onBoxAdd(boxTypes.ROOF)}
						>
							<span><T ctx="this is a button to add top cover module of a hive, a roof that protects from weather">Add roof</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							loading={adding}
							color="white"
							title="Add feeder"
							onClick={() => onBoxAdd(boxTypes.HORIZONTAL_FEEDER, 'underRoof')}
						>
							<span><T ctx="this is a button to add tiny part of beehive, a horizontal box where sugar syrup can be poured to feed bees">Add feeder</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							loading={adding}
							color="white"
							title="Add ventilation"
							onClick={() => onBoxAdd(boxTypes.VENTILATION)}
						>
							<span><T ctx="this is a button to add tiny part of beehive, specifically holes on top for ventilation">Add inner lid</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							loading={adding}
							title="Add super on top"
							onClick={() => onBoxAdd(boxTypes.SUPER)}
						>
							<AddSuperIcon /><span><T ctx="this is a button to add new section of beehive, a super box that is intended for honey frames">Add super</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							loading={adding}
							color="white"
							title="Add queen excluder"
							onClick={() => onBoxAdd(boxTypes.QUEEN_EXCLUDER)}
						>
							<span><T ctx="this is a button to add tiny part of beehive, a horizontal layer that prevents queen bee from moving through this">Add queen excluder</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							title="Add box on top"
							loading={adding}
							color='black'
							onClick={() => onBoxAdd(boxTypes.DEEP)}
						>
							<AddBoxIcon /><span><T ctx="this is a button to add new section of beehive, a deep box that is intended for brood frames">Add deep</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							loading={adding}
							title="Add entrance"
							onClick={() => onBoxAdd(boxTypes.GATE, 'bottom')}
						>
							<GateIcon /><span><T ctx="this is a button to add new section of beehive, specifically holes, an entrance">Add entrance</T></span>
						</Button>
						<Button
							className={styles.actionButton}
							loading={adding}
							color="white"
							title="Add bottom board"
							onClick={() => onBoxAdd(boxTypes.BOTTOM, 'bottom')}
						>
							<span><T ctx="this is a button to add bottom board of beehive with slideable white panel for varroa mite counting">Add bottom</T></span>
						</Button>
					</>
					)}
					{showRemoveButton && (
						<Button
							className={`${styles.actionButton} ${styles.removeButton} ${styles.removeButtonOutline}`}
							color="white"
							loading={removingBox}
							onClick={() => setRemoveBoxDialogVisible(true)}
						><DeleteIcon /> <T>Remove box</T></Button>
					)}
				</div>
			)}

			{showBulkUpload && (
				<BulkUploadInline
					hiveId={+hiveId}
					boxId={+box.id}
					apiaryId={+apiaryId}
					frames={frames}
					onComplete={() => {}}
				/>
			)}
			{box?.id && removeBoxDialogVisible && (
				<Modal
					title={<T>Remove box</T>}
					onClose={() => setRemoveBoxDialogVisible(false)}
				>
					<div style={{ marginBottom: '12px' }}>
						<T>Are you sure you want to remove this box?</T>
					</div>
					<div className={styles.removeBoxActions}>
						<div className={styles.actionWithHint}>
							<Button color="gray" onClick={() => setRemoveBoxDialogVisible(false)}>
								<T>Cancel</T>
							</Button>
							<div className={styles.keyHint}>Esc</div>
						</div>
						<div className={styles.actionWithHint}>
							<Button
								color="red"
								onClick={async () => {
									if (!box?.id) return
									await onBoxRemoveChoice('trash', +box.id)
								}}
							>
								<T>To trash</T>
							</Button>
						</div>
						<div className={styles.actionWithHint}>
							<Button
								color="green"
								onClick={async () => {
									if (!box?.id) return
									await onBoxRemoveChoice('warehouse', +box.id)
								}}
							>
								<T>To warehouse</T>
							</Button>
							<div className={styles.keyHint}>Enter</div>
						</div>
					</div>
				</Modal>
			)}
		</>
	)
}
