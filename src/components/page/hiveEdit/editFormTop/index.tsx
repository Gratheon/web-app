import React from 'react'

import { PopupButton, PopupButtonGroup } from '../../../shared/popupButton'
import VisualForm from '../../../shared/visualForm'
import HiveIcon from '../../../shared/hiveIcon'
import DeactivateButton from '../deleteButton'
import InspectionButton from '../createInspection'
import QueenColor from './queenColor'
import Button from '../../../shared/button'

export default function HiveEditDetails({
	apiaryId,
	hive,
	boxes,
	onQueenYearChange,
	onRaceChange,
	onSubmit,
	onNotesChange,
	onInput,
}) {
	return (
		<div style={{ padding: '20px', display: 'flex' }}>
			<div style={{ width: 68, textAlign: 'center', marginRight: 10 }}>
				<HiveIcon boxes={boxes} editable={true} />
			</div>
			<VisualForm onSubmit={onSubmit} style="flex-grow:1">
				<div>
					<label htmlFor="name">Name</label>
					<input
						name="name"
						id="name"
						style={{ flexGrow: 1 }}
						autoFocus
						value={hive.name}
						onInput={onInput}
					/>

					<PopupButtonGroup className="green">
						<Button type="submit">Save</Button>
						<PopupButton className="green">
							{/* <InspectionButton
								apiaryId={apiaryId}
								inspections={hive.inspections}
								onBeforeSave={onSubmit}
								hive={hive}
							/> */}

							<DeactivateButton hiveId={hive.id} />
						</PopupButton>
					</PopupButtonGroup>
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
