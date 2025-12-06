import { useMemo, useState, useEffect } from 'preact/hooks'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import QueenSlot from '@/page/hiveEdit/hiveTopInfo/QueenSlot'
import AddQueenModal from '@/page/hiveEdit/hiveTopInfo/AddQueenModal'
import WarehouseDropZone from '@/page/hiveEdit/hiveTopInfo/WarehouseDropZone'

import { useMutation } from '@/api'
import { updateHive, getHive } from '@/models/hive'
import { Box, getBoxes, updateBox } from '@/models/boxes'
import { getFamilyByHive, getAllFamiliesByHive, updateFamily, deleteFamily } from '@/models/family'
import { Family } from '@/models/family'
import { InspectionSnapshot } from '@/models/inspections'
import { getFramesByHive } from '@/models/frames'
import { getHiveInspectionStats, deleteCellsByFrameSideIDs } from '@/models/frameSideCells'
import { collectFrameSideIDsFromFrames } from '@/models/frameSide'
import { deleteFilesByFrameSideIDs } from '@/models/frameSideFile'


import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import HiveIcon from '@/shared/hive'
import Loader from '@/shared/loader'
import ErrorMessage from '@/shared/messageError'
import BeeCounter from '@/shared/beeCounter'
import MessageSuccess from '@/shared/messageSuccess'

import styles from './styles.module.less'

export default function HiveEditDetails({ apiaryId, hiveId, buttons }) {
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)
	let [showAddQueenModal, setShowAddQueenModal] = useState(false)
	let [isDraggingQueen, setIsDraggingQueen] = useState(false)

	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId]);
	let families = useLiveQuery(() => {
		console.log('HiveTopEditForm: querying families for hive', hiveId)
		return getAllFamiliesByHive(+hiveId)
	}, [hiveId]);

	console.log('HiveTopEditForm: families loaded:', families)

	if (!families) {
		families = []
	}

	let [mutateBoxColor, { error: errorColor }] = useMutation(
		`mutation updateBoxColor($boxID: ID!, $color: String!) { updateBoxColor(id: $boxID, color: $color) }`
	)

	let [mutateHive, { error: errorHive }] = useMutation(`mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
			__typename
			family{
				id
				__typename
				race
				added
				color
			}
		}
	}`)
	let [mutateInspection, { error: errorInspection }] = useMutation(`	mutation addInspection($inspection: InspectionInput!) {
		addInspection(inspection: $inspection) {
			id
		}
	}`)
	let [cloneFramesForInspection, { error: errorInspection2 }] = useMutation(`mutation cloneFramesForInspection($frameSideIDs: [ID], $inspectionId: ID!) {
		cloneFramesForInspection(frameSideIDs: $frameSideIDs, inspectionId: $inspectionId)
	}`)

	let [noteInput, setNoteInput] = useState('')

	useEffect(() => {
		if (hive) {
			setNoteInput(hive.notes || '')
		}
	}, [hive])

	const onCreateInspection = useMemo(
		() =>
			debounce(async function (v) {
				setCreatingInspection(true)

				let hive = await getHive(+hiveId)
				let boxes = await getBoxes({ hiveId: +hiveId })
				let family = await getFamilyByHive(+hiveId)
				let frames = await getFramesByHive(+hiveId)
				let frameSideIDs = collectFrameSideIDsFromFrames(frames)
				let cellStats = await getHiveInspectionStats(frames)

				let inspectionSnapshot: InspectionSnapshot = {
					hive,
					family,
					boxes,
					frames,
					cellStats
				}

				let createdInspection = await mutateInspection({
					inspection: {
						hiveId: +hiveId,
						data: JSON.stringify(inspectionSnapshot)
					},
				})

				await cloneFramesForInspection({
					inspectionId: createdInspection.data.addInspection.id,
					frameSideIDs
				}
				)

				deleteCellsByFrameSideIDs(frameSideIDs)
				deleteFilesByFrameSideIDs(frameSideIDs)

				hive.inspectionCount = hive.inspectionCount + 1
				updateHive(hive)
				setCreatingInspection(false)

				setOkMsg(
					<MessageSuccess title={<T>Inspection created</T>} message={<T>All frame statistics is reset for the new state</T>} />
				)

			}, 1000),
		[]
	)

	const onNameChange = useMemo(
		() =>
			debounce(async function (v) {
				const hive = await getHive(+hiveId)
				hive.name = v.target.value

				let family = await getFamilyByHive(+hiveId)
				if (!family) {
					family = {
						id: null,
						race: '',
						added: ''
					}
				}

				await mutateHive({
					hive: {
						id: hive.id,
						name: hive.name,
						notes: hive.notes,
						family: {
							id: family.id,
							race: family.race,
							added: family.added,
						},
					},
				})

				await updateHive(hive)
			}, 1000),
		[]
	)

	const onNotesChange = useMemo(
		() =>
			debounce(async function (v) {
				setNoteInput(v.target.value)

				const hive = await getHive(+hiveId)
				hive.notes = v.target.value

				let family = await getFamilyByHive(+hiveId)
				if (!family) {
					family = {
						id: null,
						race: '',
						added: '',
						age: null
					}
				}

				await mutateHive({
					hive: {
						id: hive.id,
						name: hive.name,
						notes: hive.notes,
						family: {
							id: family.id,
							race: family.race,
							added: family.added,
						},
					},
				})
				await updateHive(hive)
			}, 300),
		[]
	)

	async function onColorChange(box: Box) {
		await mutateBoxColor({
			boxID: box.id,
			color: box.color,
		})

		await updateBox(box)
	}

	const onRaceChange = useMemo(
		() =>
			debounce(async function (v) {
				const hive = await getHive(+hiveId)
				let family = await getFamilyByHive(+hiveId) || { hiveId: +hiveId } as Family
				family.race = v.target.value
				let { data } = await mutateHive({
					hive: {
						id: hive.id,
						name: hive.name,
						notes: hive.notes,
						family: {
							id: family?.id,
							race: family?.race,
							added: family?.added,
						},
					},
				})
				family.id = +data.updateHive.family.id;

				if (family) {
					await updateFamily(family)
				}
			}, 1000),
		[]
	)

	const onQueenYearChange = useMemo(
		() =>
			debounce(async function (v) {
				const hive = await getHive(+hiveId)
				let family = await getFamilyByHive(+hiveId) || { hiveId: +hiveId } as Family
				family.added = v.target.value

				let { data } = await mutateHive({
					hive: {
						id: hive.id,
						name: hive.name,
						notes: hive.notes,
						family: {
							id: family.id,
							race: family.race,
							added: family.added,
						},
					},
				})

				family.id = +data.updateHive.family.id;

				if (family) {
					await updateFamily(family)
				}
			}, 1000),
		[]
	)

	const handleAddQueen = () => {
		setShowAddQueenModal(true)
	}

	const handleUpdateQueen = async (familyId: number, race: string, year: string, color?: string) => {
		try {
			const families = await getAllFamiliesByHive(+hiveId)
			const family = families.find(f => f.id === familyId)

			if (family) {
				family.race = race
				family.added = year
				family.color = color || null

				await updateFamily(family)

				const hive = await getHive(+hiveId)
				await mutateHive({
					hive: {
						id: hive.id,
						name: hive.name,
						notes: hive.notes,
						family: {
							id: family.id,
							race: family.race,
							added: family.added,
							color: family.color,
						},
					},
				})
			}
		} catch (err) {
			console.error('Failed to update queen:', err)
		}
	}

	const handleRemoveQueen = async (familyId: number) => {
		try {
			await deleteFamily(familyId)

			const remainingFamilies = await getAllFamiliesByHive(+hiveId)
			const hive = await getHive(+hiveId)

			if (remainingFamilies.length === 0) {
				await mutateHive({
					hive: {
						id: hive.id,
						name: hive.name,
						notes: hive.notes,
						family: null,
					},
				})
			}
		} catch (err) {
			console.error('Failed to remove queen:', err)
		}
	}

	const handleWarehouseDrop = async (familyId: number) => {
		console.log('Move queen to warehouse:', familyId)
		await handleRemoveQueen(familyId)
	}

	if (!hive) {
		return <Loader />
	}

	return (
		<div>
			<WarehouseDropZone
				visible={isDraggingQueen}
				onDrop={handleWarehouseDrop}
			/>

			<ErrorMessage error={errorColor || errorHive} />
			{okMsg}

			<div className={styles.form}>
				<div style="padding-right:10px;">
					<HiveIcon onColorChange={onColorChange} boxes={boxes} editable={true} />
					<BeeCounter count={hive.beeCount} />
				</div>
				<div>
					<VisualForm>
						<div>
							<label htmlFor="name" style="width:100px;"><T ctx="this is a form label for input of the beehive">Name</T></label>
							<input
								name="name"
								id="name"
								style="width:100%;"
								autoFocus
								value={hive.name}
								onInput={onNameChange}
							/>
						</div>

						<div>
							<label htmlFor="queen">
								{families.length > 1 ? <T>Queens</T> : <T>Queen</T>}
							</label>
							<QueenSlot
								families={families}
								editable={true}
								onAddQueen={handleAddQueen}
								onRemoveQueen={handleRemoveQueen}
								onUpdateQueen={handleUpdateQueen}
								onDragStart={() => setIsDraggingQueen(true)}
								onDragEnd={() => setIsDraggingQueen(false)}
								showAddButton={families.length > 0}
							/>
						</div>

						<div>
							<label htmlFor="notes">
								<T>Notes</T>
							</label>

							<div>
								<textarea
									className={styles.notes}
									style={{
										marginTop: 3,
										background: noteInput ? '#EEE' : 'white',
										minHeight: noteInput ? 40 : 20,
										width: `calc(100% - 20px)`
									}}
									name="notes"
									placeholder="Notes"
									id="notes"
									value={noteInput}
									onChange={onNotesChange}
								/>
							</div>
						</div>
					</VisualForm>

					{buttons}

				</div>
			</div>

			{showAddQueenModal && (
				<AddQueenModal
					hiveId={+hiveId}
					onClose={() => setShowAddQueenModal(false)}
					onSuccess={() => {
						setShowAddQueenModal(false)
						setOkMsg(
							<MessageSuccess
								title={<T>Queen Added</T>}
								message={<T>The queen has been successfully added to the hive</T>}
							/>
						)
					}}
				/>
			)}
		</div>
	)
}
