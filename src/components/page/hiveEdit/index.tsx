import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/components/api'
import Boxes from './boxes'

import HIVE_QUERY from './_api/hiveQuery.graphql'
import HiveEditDetails from './editFormTop'

import ErrorMsg from '@/components/shared/messageError'
import ErrorGeneral from '@/components/shared/messageErrorGlobal'
import { boxTypes, getBox } from '@/components/models/boxes'
import { getHive } from '@/components/models/hive'
import { getApiary } from '@/components/models/apiary'
import Loader from '@/components/shared/loader'
import isDev from '@/components/isDev'

import Frame from './frame'
import styles from './styles.less'
import GateBox from './gateBox/GateBox'
import MessageNotFound from '@/components/shared/messageNotFound'
import HiveAdvisor from './hiveAdvisor'
import BreadCrumbs from '@/components/shared/breadcrumbs'
import SubMenu from '@/components/shared/submenu'

export default function HiveEditForm() {
	let { apiaryId, hiveId, boxId, frameId, frameSideId } = useParams()
	let [error, onError] = useState(null)

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const box = useLiveQuery(() => getBox(+boxId), [boxId], null)

	if(apiary ===null || hive === null){
		return <Loader/>
	}
	
	let loading,
		errorGet,
		errorNetwork

	// if local cache is empty - query
	if (!apiary || !hive) {
		({
			loading,
			error: errorGet,
			errorNetwork
		} = useQuery(HIVE_QUERY, { variables: { id: +hiveId, apiaryId: +apiaryId } }))

		if (loading) {
			return <Loader />
		} else{
			return <MessageNotFound msg="Hive not found" />
		}
	}

	let okMsg

	// inline error from deeper components
	let errorMsg = <ErrorMsg error={error || errorGet || errorNetwork} />


	let breadcrumbs = []

	if (apiary) {
		breadcrumbs[0] = {
			name: `Apiary "${apiary.name}"`,
			uri: `/apiaries/edit/${apiaryId}`,
		}
	}


	if (hive) {
		breadcrumbs[1] = {
			name: `Hive "${hive.name}"`,
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

			<HiveEditDetails hiveId={hiveId} />

			<div className={styles.boxesFrameWrap}>
				<div className={styles.boxesWrap} id="boxesWrap">
				<Boxes
						onError={onError}
						apiaryId={apiaryId}
						hiveId={hiveId}
						boxId={boxId}
						frameId={frameId}
						frameSideId={frameSideId}
					/>
				</div>

				<div className={styles.frameWrap}>
					<Frame
						apiaryId={apiaryId}
						boxId={boxId}
						frameId={frameId}
						hiveId={hiveId}
						frameSideId={frameSideId}
					/>

					{!frameId && box && box.type !== boxTypes.GATE && <HiveAdvisor 
						apiary={apiary}
						hive={hive}
						hiveId={hiveId} />}


					{box && box.type === boxTypes.GATE && isDev() &&
						<GateBox boxId={boxId} />
					}
				</div>
			</div>
		</div>
	)
}
