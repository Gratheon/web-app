import React, { useMemo, useState, useEffect, useRef } from 'react'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'

import { useMutation } from '@/api'
import { updateHive, getHive } from '@/models/hive.ts'
import { Box, getBoxes, updateBox } from '@/models/boxes.ts'
import { getFamilyByHive, updateFamily } from '@/models/family.ts'
import { Family } from '@/models/family.ts'
import { InspectionSnapshot } from '@/models/inspections.ts'
import { getFramesByHive } from '@/models/frames.ts'
import { getHiveInspectionStats, deleteCellsByFrameSideIDs } from '@/models/frameSideCells.ts'
import { collectFrameSideIDsFromFrames } from '@/models/frameSide.ts'
import { deleteFilesByFrameSideIDs } from '@/models/frameSideFile.ts'


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

									<QueenColor year={family?.added} useRelative={false} />
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
		</div>
	)
}
