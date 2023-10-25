import React, { useMemo } from 'react'
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
import { getBoxes, updateBox } from '@/components/models/boxes'
import { getFamilyByHive, updateFamily } from '@/components/models/family'
import Loader from '@/components/shared/loader'
import ErrorMessage from '@/components/shared/messageError'
import { Box, Family } from '@/components/api/schema'

export default function HiveEditDetails({ hiveId }) {
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
	}
`)
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
			}, 1000),
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
			<div className={styles.form}>
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
					</VisualForm>

					<textarea
						className={styles.notes}
						style={{
							marginTop:3,
							background: hive.notes ? '#EEE' : 'white',
							minHeight: hive.notes ? 32 : 20,
							width: `calc(100% - 20px)`
						}}
						name="notes"
						placeholder="Notes"
						id="notes"
						value={hive.notes}
						onChange={onNotesChange}
					/>
				</div>
				<div style={{ textAlign: 'center', marginLeft: 6 }}>
					<HiveIcon onColorChange={onColorChange} boxes={boxes} editable={true} />
					<div style="font-size:12px">
						{hive.beeCount && <>🐝{hive.beeCount} </>}
					</div>

					<DeactivateButton hiveId={hive.id} />
				</div>
			</div>
		</div>
	)
}
