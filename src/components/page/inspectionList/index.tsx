import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/components/api'

import INSPECTION_QUERY from './inspectionQuery.graphql'

import ErrorMsg from '@/components/shared/messageError'
import ErrorGeneral from '@/components/shared/messageErrorGlobal'
import { getBox } from '@/components/models/boxes'
import { getHive } from '@/components/models/hive'
import { getApiary } from '@/components/models/apiary'
import Loader from '@/components/shared/loader'
import MessageNotFound from '@/components/shared/messageNotFound'
import BreadCrumbs from '@/components/shared/breadcrumbs'
import SubMenu from '@/components/shared/submenu'
import InspectionBar from './inspectionBar'
import { listInspections, Inspection } from '@/components/models/inspections'
import T from '@/components/shared/translate'
import InspectionView from './inspectionView'
import DateFormat from '@/components/shared/dateFormat'
import HiveIcon from '@/components/icons/hive'
import InspectionIcon from '@/components/icons/inspection'
import { getUser } from '@/components/models/user'

export default function InspectionList() {
	let { apiaryId, hiveId, boxId, inspectionId } = useParams()
	let [error, onError] = useState(null)

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const box = useLiveQuery(() => getBox(+boxId), [boxId], null)

	if (apiary === null || hive === null) {
		return <Loader />
	}

	let loading,
		errorGet,
		errorNetwork

	let user = useLiveQuery(() => getUser(), [], null)
	const inspections = useLiveQuery(() => listInspections(+hiveId), [hiveId], null)
	// if local cache is empty - query
	if (inspections == null || inspections.length === 0) {
		({
			loading,
			error: errorGet,
			errorNetwork
		} = useQuery(INSPECTION_QUERY, { variables: { hiveId: +hiveId } }))
	}

	if (loading) {
		return <Loader />
	}

	let okMsg

	// inline error from deeper components
	let errorMsg = <ErrorMsg error={error || errorGet || errorNetwork} />


	let breadcrumbs = []

	if (apiary) {
		breadcrumbs[0] = {
			name: <>«{apiary.name}» <T>apiary</T></>,
			uri: `/apiaries/edit/${apiaryId}`,
		}
	}

	if (hive) {
		breadcrumbs[1] = {
			icon: <HiveIcon size={12} />,
			name: <>«{hive.name}» <T>hive</T></>,
			uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
		}
	}

	if (inspectionId) {
		let selectedInspection = inspections.find((i: Inspection) => i.id == +inspectionId)
		if (selectedInspection) {
			breadcrumbs[2] = {
				icon: <InspectionIcon size={12} />,
				name: (<><DateFormat
					lang={user ? user.lang : 'en'}
					datetime={selectedInspection?.added}
				/> <T>inspection</T>
				</>),
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/inspections/${inspectionId}`,
			}
		}
	}


	if (!inspections || inspections.length === 0) {
		return (
			<MessageNotFound msg={<T>No inspections found</T>}>
				<div>
					<T ctx="this is an error message that explains why no inspections are viewed">Inspection is a snapshot state of beehive at specific time. Inspection can be created from hive view</T>
				</div>
			</MessageNotFound>
		)
	}

	return (
		<div>
			<BreadCrumbs items={breadcrumbs}>
				{hive && <SubMenu
					currentUrl={`/apiaries/${apiaryId}/hives/${hiveId}`}
					inspectionsUrl={`/apiaries/${apiaryId}/hives/${hiveId}/inspections`}
					inspectionCount={hive.inspectionCount}
				/>}
			</BreadCrumbs>
			<ErrorGeneral />

			{okMsg}
			{errorMsg}

			{inspections.length > 0 && <>
				<div style={{ padding: 20 }}>
					{inspections.map((inspection: Inspection) => (
						<InspectionBar
							selected={+inspectionId == inspection.id}
							apiaryId={apiaryId}
							hiveId={hive.id}
							id={inspection.id}
							key={inspection.id}
							data={inspection.data}
							added={inspection.added}
						/>
					))}
				</div>

				<div>
					{inspectionId && <InspectionView
						apiaryId={apiaryId}
						hiveId={hive.id}
						inspectionId={inspectionId}
					/>}
				</div>
			</>}
		</div>
	)
}