import React, { useMemo, useState } from 'react'
import debounce from 'lodash.debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import T from '@/components/shared/translate'
import VisualForm from '@/components/shared/visualForm'
import HiveIcon from '@/components/shared/hiveIcon'
import DeactivateButton from '../deleteButton'
import QueenColor from './queenColor'
import styles from './styles.less'

import { useMutation } from '@/components/api'
import { updateHive, getHive } from '@/components/models/hive'
import { Box, getBoxes, updateBox } from '@/components/models/boxes'
import { getFamilyByHive, updateFamily } from '@/components/models/family'

import Loader from '@/components/shared/loader'
import ErrorMessage from '@/components/shared/messageError'
import { Family } from '@/components/api/schema'
import Button from '@/components/shared/button'
import { PopupButton, PopupButtonGroup } from '@/components/shared/popupButton'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import { InspectionSnapshot } from '@/components/models/inspections'
import { getFramesByHive } from '@/components/models/frames'
import { getHiveInspectionStats, deleteCellsByFrameSideIDs } from '@/components/models/frameSideCells'
import BeeCounter from '@/components/shared/beeCounter'
import { getFrameSideIDsFrames } from '@/components/models/frameSide'
import { deleteFilesByFrameSideIDs } from '@/components/models/frameSideFile'
import MessageSuccess from '@/components/shared/messageSuccess'

export default function HiveEditDetails({ hiveId }) {
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)

	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId])
	let family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId])

	let [mutateBoxColor, { error: errorColor }] = useMutation(
		`mutation updateBoxColor($boxID: ID!, $color: String!) { updateBoxColor(id: $boxID, color: $color) }`
	)

	let [mutateHive, { error: errorHive }] = useMutation(`mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
			__typename
			family{
				id
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

	const onCreateInspection = useMemo(
		() =>
			debounce(async function (v) {
				setCreatingInspection(true)

				let hive = await getHive(+hiveId)
				let boxes = await getBoxes({ hiveId: +hiveId })
				let family = await getFamilyByHive(+hiveId)
				let frames = await getFramesByHive(+hiveId)
				let frameSideIDs = getFrameSideIDsFrames(frames)
				let cellStats = await getHiveInspectionStats(frames)

				let inspectionSnapshot : InspectionSnapshot = {
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
			}, 300),
		[]
	)

	const onNotesChange = useMemo(
		() =>
			debounce(async function (v) {
				const hive = await getHive(+hiveId)
				hive.notes = v.target.value

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

	if (!hive) {
		return <Loader />
	}

	return (
		<div>
			<ErrorMessage error={errorColor || errorHive} />
			{okMsg}

			<div className={styles.form}>
				<div style="padding-right:10px;">
					<HiveIcon onColorChange={onColorChange} boxes={boxes} editable={true} />
					<BeeCounter	count={hive.beeCount} />
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
							<label htmlFor="race"><T ctx="this is a form label for input of the bee queen race and year">Queen</T></label>

							<div>
								<input
									name="race"
									placeholder="Race"
									className={styles.race}
									value={family ? family.race : ''}
									onInput={onRaceChange}
								/>

								<div style="position:relative;display:inline-block;">
									<input
										placeholder="Year"
										name="queenYear"
										id="queenYear"
										minLength={4}
										maxLength={4}
										className={styles.year}
										value={family ? family.added : ''}
										onInput={onQueenYearChange}
									/>

									<QueenColor year={family?.added} />
								</div>
							</div>
						</div>

						<div>
							<label htmlFor="race">
							</label>

							<div>
								<textarea
									className={styles.notes}
									style={{
										marginTop:3,
										background: hive.notes ? '#EEE' : 'white',
										minHeight: hive.notes ? 40 : 20,
										width: `calc(100% - 20px)`
									}}
									name="notes"
									placeholder="Notes"
									id="notes"
									value={hive.notes}
									onChange={onNotesChange}
								/>
							</div>
						</div>
					</VisualForm>

					<VisualFormSubmit>
						<PopupButtonGroup>
							<Button loading={creatingInspection} onClick={onCreateInspection}>
								<T ctx="This is a button that adds new beehive inspection as a snapshot of current beehive state">Create Inspection</T>
							</Button>
							<PopupButton>
								<DeactivateButton hiveId={hive.id} />
							</PopupButton>
						</PopupButtonGroup>
					</VisualFormSubmit>

				</div>
			</div>
		</div>
	)
}
