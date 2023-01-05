import React, { useMemo } from 'react'
import debounce from 'lodash.debounce'

// import { PopupButton, PopupButtonGroup } from '../../../shared/popupButton'
import VisualForm from '../../../shared/visualForm'
import HiveIcon from '../../../shared/hiveIcon'
import DeactivateButton from '../deleteButton'
import QueenColor from './queenColor'
// import Button from '../../../shared/button'

import { useMutation } from '../../../api'
import {updateHive} from '../../../models/hive'

export default function HiveEditDetails({ hive, boxes }) {
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
				await updateHive(hive.id, {name})
				await mutateHive({
					hive: {
						id: hive.id,
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
				await updateHive(hive.id, {notes})
				await mutateHive({
					hive: {
						id: hive.id,
						notes,
					},
				})
			}, 1000),
		[]
	)

	function onRaceChange() {}

	function onQueenYearChange() {}

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
						value={hive.family ? hive.family.race : ''}
						onInput={onRaceChange}
					/>

					<input
						name="queenYear"
						id="queenYear"
						minLength={4}
						maxLength={4}
						style={{ width: 40 }}
						placeholder="year"
						value={hive.family ? hive.family.added : ''}
						onInput={onQueenYearChange}
					/>

					<QueenColor year={hive.family?.added} />
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
