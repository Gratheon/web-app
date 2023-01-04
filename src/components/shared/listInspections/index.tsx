import JournalItem from './journalItem'
import React from 'react'

type ListInspectionsProps = {
	selectedInspectionId : string
	inspections:any
	hive:any
	editable:boolean
	inspectionData:any
	apiaryId:string
}

//todo
type Inspection = any;

export default function listInspections({
	selectedInspectionId,
	inspections,
	hive,
	editable=false,
	inspectionData,
	apiaryId,
}:ListInspectionsProps) {
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
		<div style={{padding: "0 20px" }}>
			<h3>Inspection history</h3>

			<div style={{flexGrow:1, display:"flex"}}>
				{inspections.map((inspection: Inspection) => (
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
