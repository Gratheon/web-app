import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/components/api'

import INSPECTION_QUERY from './inspectionQuery.graphql'

import ErrorMsg from '@/components/shared/messageError'
import ErrorGeneral from '@/components/shared/messageErrorGlobal'
import { boxTypes, getBox } from '@/components/models/boxes'
import { getHive } from '@/components/models/hive'
import { getApiary } from '@/components/models/apiary'
import Loader from '@/components/shared/loader'
import MessageNotFound from '@/components/shared/messageNotFound'
import BreadCrumbs from '@/components/shared/breadcrumbs'
import SubMenu from '@/components/shared/submenu'
import JournalItem from './journalItem'
import { listInspections, Inspection } from '@/components/models/inspections'

export default function InspectionList() {
	let { apiaryId, hiveId, boxId, frameId, frameSideId, selectedInspectionId } = useParams()
	let [error, onError] = useState(null)

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const box = useLiveQuery(() => getBox(+boxId), [boxId], null)
	const inspections = useLiveQuery(() => listInspections(+hiveId), [hiveId], null)

	if(apiary ===null || hive === null){
		return <Loader/>
	}
	
	let loading,
		errorGet,
		data,
		errorNetwork

	// if local cache is empty - query
	if (!inspections) {
		({
			loading,
			data,
			error: errorGet,
			errorNetwork
		} = useQuery(INSPECTION_QUERY, { variables: { hiveId: +hiveId } }))

		console.log({data})

		if (loading) {
			return <Loader />
		}
	}

	let okMsg

	// inline error from deeper components
	let errorMsg = <ErrorMsg error={error || errorGet || errorNetwork} />


	let breadcrumbs = []

	if (apiary) {
		breadcrumbs[0] = {
			name: `Apiary ${apiary.name}`,
			uri: `/apiaries/edit/${apiaryId}`,
		}
	}

	if (hive) {
		breadcrumbs[1] = {
			name: `Hive ${hive.name}`,
				uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
		}
	}

	if (box) {
		if (box.type === boxTypes.GATE) {
			breadcrumbs.push({
				'name': `Entrance #${box.id}`,
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		} else {
			breadcrumbs.push({
				'name': `Box #${box.id}`,
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		}
	}

	return (
		<div>
			<BreadCrumbs items={breadcrumbs}>
				<SubMenu
					currentUrl={`/apiaries/${apiaryId}/hives/${hiveId}`}
					inspectionsUrl={`/apiaries/${apiaryId}/hives/${hiveId}/inspections`}
					hasInspections={true}
				/>
			</BreadCrumbs>
			<ErrorGeneral />

			{okMsg}
			{errorMsg}

			{!inspections && <MessageNotFound msg="No inspections found" />}

			<div style={{ flexGrow: 1, display: 'flex' }}>
				{inspections && inspections.map((inspection: Inspection) => (
					<JournalItem
						selected={+selectedInspectionId == inspection.id}
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