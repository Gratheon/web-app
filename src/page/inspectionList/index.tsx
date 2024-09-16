import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '../../api'

import ErrorMsg from '../../shared/messageError'
import ErrorGeneral from '../../shared/messageErrorGlobal'
import Loader from '../../shared/loader'
import MessageNotFound from '../../shared/messageNotFound'
import BreadCrumbs from '../../shared/breadcrumbs'
import InspectionsLink from '../../shared/inspectionsLink/index.tsx'
import T from '../../shared/translate'
import DateFormat from '../../shared/dateFormat'

import { getHive } from '../../models/hive.ts'
import { getApiary } from '../../models/apiary.ts'
import { listInspections, Inspection } from '../../models/inspections.ts'
import { getUser } from '../../models/user.ts'

import HiveIcon from '../../icons/hive.tsx'
import InspectionIcon from '../../icons/inspection.tsx'

import INSPECTION_QUERY from './inspectionQuery.graphql.ts'
import InspectionBar from './inspectionBar'
import InspectionView from './inspectionView'
import styles from './styles.module.less'
import InspectionShareButton from './inspectionShareButton'

export default function InspectionList() {
	let { apiaryId, hiveId, boxId, inspectionId } = useParams()
	let [error, onError] = useState(null)

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)

	if (apiary === null || hive === null) {
		return <Loader />
	}

	let loading, errorGet, errorNetwork

	let user = useLiveQuery(() => getUser(), [], null)
	const inspections = useLiveQuery(
		() => listInspections(+hiveId),
		[hiveId],
		null
	)
	// if local cache is empty - query
	if (inspections == null || inspections.length === 0) {
		;({
			loading,
			error: errorGet,
			errorNetwork,
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
			name: (
				<>
					«{apiary.name}» <T>apiary</T>
				</>
			),
			uri: `/apiaries/edit/${apiaryId}`,
		}
	}

	if (hive) {
		breadcrumbs[1] = {
			icon: <HiveIcon size={12} />,
			name: (
				<>
					«{hive.name}» <T>hive</T>
				</>
			),
			uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
		}
	}

	if (inspectionId) {
		let selectedInspection = inspections.find(
			(i: Inspection) => i.id == +inspectionId
		)
		if (selectedInspection) {
			breadcrumbs[2] = {
				icon: <InspectionIcon size={12} />,
				name: (
					<>
						<DateFormat
							lang={user ? user.lang : 'en'}
							datetime={selectedInspection?.added}
						/>{' '}
						<T>inspection</T>
					</>
				),
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/inspections/${inspectionId}`,
			}
		}
	}

	if (!inspections || inspections.length === 0) {
		return (
			<MessageNotFound msg={<T>No inspections found</T>}>
				<div>
					<T ctx="this is an error message that explains why no inspections are viewed">
						Inspection is a snapshot state of beehive at specific time.
						Inspection can be created from hive view
					</T>
				</div>
			</MessageNotFound>
		)
	}

	return (
		<div>
			<BreadCrumbs items={breadcrumbs} />
			<ErrorGeneral />

			{okMsg}
			{errorMsg}

			<h1 style="padding: 0 10px;">
				<T ctx="This is a heading for beehive inspections">Inspections</T>
			</h1>

			{inspections.length > 0 && (
				<div className={styles.flex}>
					<div className={styles.inspectionList}>
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
						<InspectionShareButton
							apiaryId={apiaryId}
							hiveId={hiveId}
							inspectionId={inspectionId}
						/>
						{inspectionId && (
							<InspectionView
								apiaryId={apiaryId}
								hiveId={hive.id}
								inspectionId={inspectionId}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
