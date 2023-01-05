import React from 'react'

import { PopupButton, PopupButtonGroup } from '../../../shared/popupButton'
import VisualForm from '../../../shared/visualForm'
import HiveIcon from '../../../shared/hiveIcon'
import DeactivateButton from '../deleteButton'
import QueenColor from './queenColor'
import Button from '../../../shared/button'

export default function HiveEditDetails({
	hive,
	boxes,
}) {

	// todo implement it
	function onRaceChange(){

	}

	function onNotesChange(){

	}

	function onQueenYearChange(){

	}

	function onNameChange(){

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
