import { useQuery } from '../../api'
import INSPECTION_QUERY from './inspectionQuery.graphql'
import Loading from '../../shared/loader'
import DateFormat from '../../shared/dateFormat'
import Boxes from '../hiveEdit/boxes'
import React from 'react'
import Link from '../../shared/link'
import ErrorMsg from '../../shared/messageError'
import InspectionList from '../../shared/listInspections'

export default ({ apiaryId, hiveId, inspectionId }) => {
	let {
		loading: loadingGet,
		error: errorGet,
		data: inspectionGet,
	} = useQuery(INSPECTION_QUERY, {
		variables: {
			inspectionId: inspectionId,
			hiveId: hiveId,
		},
	})

	if (loadingGet) {
		return <Loading />
	}

	if (errorGet) {
		return <ErrorMsg error={errorGet} />
	}

	let { inspection, hive } = inspectionGet

	const inspectionData = JSON.parse(inspection.data)

	return (
		<div>
			<h1>
				<Link href={`/apiaries/${apiaryId}/hives/${hiveId}`} className={null}>
					Hive {hive.name}
				</Link>{' '}
				/ inspection{' '}
				<DateFormat
					options={{
						month: 'long',
						day: '2-digit',
						year: 'numeric',
					}}
					datetime={inspectionGet.inspection.added}
				/>
			</h1>

			<InspectionList
				selectedInspectionId={inspectionId}
				inspectionData={inspectionData}
				inspections={hive.inspections}
				editable={false}
				apiaryId={apiaryId}
				hive={hive}
			/>

			<Boxes
				editable={false}
				hiveId={hive.id}
				boxes={inspectionData.boxes}
				frames={inspectionData.frames}
				apiaryId={apiaryId}
				boxSelected={true}
				// boxSelected={parseInt(boxSelected, 10)}
				// frameSelected={parseInt(frameSelected, 10)}
				// frameSide={frameSide}
			/>
		</div>
	)
}
