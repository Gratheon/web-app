import JournalItem from './journalItem'
import React from 'react'

export default function listInspections({
	selectedInspectionId,
	inspections,
	hive,
	apiaryId,
}) {
	if (!inspections || !inspections.length) {
		return (
			<div
				style={{
					color: 'gray',
					fontSize: '12px',
					padding: '5px 100px',
				}}
			>
				No inspection yet. Create one to track hive development in time
			</div>
		)
	}

	return (
		<div style="padding:0 20px;">
			<h3>Inspection history</h3>

			<div style="flex-grow:1; display:flex;">
				{inspections.map((inspection) => (
					<JournalItem
						selected={selectedInspectionId == inspection.id}
						apiaryId={apiaryId}
						hiveId={hive.id}
						id={inspection.id}
						key={inspection.id}
						data={inspection.data}
						added={inspection.added}
					/>
				))}
			</div>
		</div>
	)
}
