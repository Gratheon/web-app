import React, { useMemo } from 'react'
import debounce from 'lodash.debounce'
import { useLiveQuery } from 'dexie-react-hooks'

import VisualForm from '@/components/shared/visualForm'
import HiveIcon from '@/components/shared/hiveIcon'
import DeactivateButton from '../deleteButton'
import QueenColor from './queenColor'

import { useMutation } from '@/components/api'
import { updateHive, getHive } from '@/components/models/hive'
import { getBoxes } from '@/components/models/boxes'
import { getFamilyByHive, updateFamily } from '@/components/models/family'
import Loader from '@/components/shared/loader'

export default function HiveEditDetails({ hiveId }) {
	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId])
	let family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId])

	let [mutateHive] = useMutation(`mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
			__typename
		}
	}
`)
	const onNameChange = useMemo(
		() =>
			debounce(async function (v) {
				const name = v.target.value
				await updateHive(+hiveId, { name })
				await mutateHive({
					hive: {
						id: hiveId,
						name,
					},
				})
			}, 1000),
		[]
	)
	const onNotesChange = useMemo(
		() =>
			debounce(async function (v) {
				const notes = v.target.value
				await updateHive(+hiveId, { notes })
				await mutateHive({
					hive: {
						id: hiveId,
						notes,
					},
				})
			}, 1000),
		[]
	)

	const onRaceChange = useMemo(
		() =>
			debounce(async function (v) {
				const race = v.target.value
				let { id } = await getFamilyByHive(+hiveId)
				await updateFamily(id, { race })
				await mutateHive({
					hive: {
						id: hiveId,
						family: {
							race,
						},
					},
				})
			}, 1000),
		[]
	)

	const onQueenYearChange = useMemo(
		() =>
			debounce(async function (v) {
				let { id } = await getFamilyByHive(+hiveId)
				const added = v.target.value
				await updateFamily(id, { added })
				await mutateHive({
					hive: {
						id: hiveId,
						family: {
							added,
						},
					},
				})
			}, 1000),
		[]
	)

	if (!hive) {
		return <Loader />
	}

	return (
		<div style={{ padding: '20px', display: 'flex' }}>
			<div style={{ width: 68, textAlign: 'center', marginRight: 10 }}>
				<HiveIcon boxes={boxes} editable={true} />
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
							width: 'calc( 100% - 40px )',
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
	)
}
