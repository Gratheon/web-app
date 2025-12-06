import { useMemo, useState, useEffect } from 'preact/hooks'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import QueenSlot from '@/page/hiveEdit/hiveTopInfo/QueenSlot'
import AddQueenModal from '@/page/hiveEdit/hiveTopInfo/AddQueenModal'
import WarehouseDropZone from '@/page/hiveEdit/hiveTopInfo/WarehouseDropZone'

import { useMutation } from '@/api'
import { updateHive, getHive, getHives } from '@/models/hive'
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
	let [hiveNumberError, setHiveNumberError] = useState(null)

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
				name
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

	const onHiveNumberChange = useMemo(
		() =>
			debounce(async function (v) {
				const newHiveNumber = v.target.value ? parseInt(v.target.value) : undefined

				if (newHiveNumber) {
					const allHives = await getHives()
					const duplicateHive = allHives.find(h =>
						h.hiveNumber === newHiveNumber &&
						h.id !== +hiveId
					)

					if (duplicateHive) {
						setHiveNumberError({
							message: `Hive number ${newHiveNumber} is already used`,
							duplicateHiveId: duplicateHive.id
						})
						return
					}
				}

				setHiveNumberError(null)

				const hive = await getHive(+hiveId)
				hive.hiveNumber = newHiveNumber

				let family = await getFamilyByHive(+hiveId)

				await mutateHive({
					hive: {
						id: hive.id,
						hiveNumber: hive.hiveNumber,
						notes: hive.notes,
						family: family ? {
							id: family.id,
							name: family.name,
							race: family.race,
							added: family.added,
							color: family.color,
						} : undefined,
					},
				})

				await updateHive(hive)
			}, 1000),
		[hiveId]
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

	const handleUpdateQueen = async (familyId: number, name: string, race: string, year: string, color?: string) => {
		try {
			const families = await getAllFamiliesByHive(+hiveId)
			const family = families.find(f => f.id === familyId)

			if (family) {
				family.name = name
				family.race = race
				family.added = year
				family.color = color || null

				await updateFamily(family)

				const hive = await getHive(+hiveId)
				await mutateHive({
					hive: {
						id: hive.id,
						notes: hive.notes,
						family: {
							id: family.id,
							name: family.name,
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
							<label htmlFor="hiveNumber" style="width:100px;"><T>Hive Number</T></label>
							<div style="width: 100%;">
								<input
									name="hiveNumber"
									id="hiveNumber"
									type="number"
									style={{
										width: '100%',
										borderColor: hiveNumberError ? '#f94144' : undefined
									}}
									value={hive.hiveNumber || ''}
									onInput={onHiveNumberChange}
									placeholder="Auto-assigned if empty"
								/>
								{hiveNumberError && (
									<div className={styles.validationError}>
										<ErrorMessage
											error={
												<span>
													{hiveNumberError.message}.{' '}
													<a
														href={`/apiaries/${apiaryId}/hives/${hiveNumberError.duplicateHiveId}`}
														className={styles.errorLink}
														onClick={(e) => {
															if (window.innerWidth > 768) {
																e.preventDefault()
																window.open(`/apiaries/${apiaryId}/hives/${hiveNumberError.duplicateHiveId}`, '_blank')
															}
														}}
													>
														<T>View hive</T> →
													</a>
												</span>
											}
										/>
									</div>
								)}
							</div>
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
