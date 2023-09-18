import React, { useMemo } from 'react'
import debounce from 'lodash.debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import VisualForm from '@/components/shared/visualForm'
import HiveIcon from '@/components/shared/hiveIcon'
import DeactivateButton from '../deleteButton'
import QueenColor from './queenColor'

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
			<div style={{ padding: '20px', display: 'flex' }}>
				<div style={{ width: 68, textAlign: 'center', marginRight: 6 }}>
					<HiveIcon onColorChange={onColorChange} boxes={boxes} editable={true} />
				</div>
				<VisualForm style="flex-grow:1">
					<div>
						<label htmlFor="name">Name</label>
						<input
							name="name"
							id="name"
							style={{ flexGrow: 1 }}
							autoFocus
							value={hive.name}
							onInput={onNameChange}
						/>

						<DeactivateButton hiveId={hive.id} />
					</div>
					<div>
						<label htmlFor="race">Queen</label>

						<input
							name="race"
							id="race"
							placeholder="race"
							value={family ? family.race : ''}
							onInput={onRaceChange}
						/>

						<input
							name="queenYear"
							id="queenYear"
							minLength={4}
							maxLength={4}
							style={{ width: 40 }}
							placeholder="year"
							value={family ? family.added : ''}
							onInput={onQueenYearChange}
						/>

						<QueenColor year={family?.added} />
					</div>

					<div>
						<label htmlFor="notes">Notes</label>
						<textarea
							style={{
								background: hive.notes ? '#EEE' : 'white',
								minHeight: hive.notes ? 32 : 20,
								padding: 10,
								borderRadius: 5,
								border: '1px solid gray',
							}}
							name="notes"
							id="notes"
							placeholder="Notes"
							value={hive.notes}
							onChange={onNotesChange}
						/>
					</div>
				</VisualForm>
			</div>
		</div>
	)
}
