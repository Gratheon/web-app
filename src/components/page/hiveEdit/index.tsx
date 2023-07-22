import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/components/api'
import Loader from '@/components/shared/loader'
import Boxes from './boxes'

import HIVE_QUERY from './_api/hiveQuery.graphql'
import HiveEditDetails from './editFormTop'
import HiveNavigationPanel from './breadcrumbs'
import ErrorMsg from '@/components/shared/messageError'
import ErrorGeneral from '@/components/shared/messageErrorGlobal'

import { boxTypes, getBoxes, getBox } from '@/components/models/boxes'
import { getHive } from '@/components/models/hive'
import { getApiary } from '@/components/models/apiary'


import Frame from './frame'
import styles from './styles.less'
import CameraCapture from '@/components/page/hiveEdit/cameraCapture'

export default function HiveEditForm() {
	let { apiaryId, hiveId, boxId, frameId, frameSideId } = useParams()
	let [error, onError] = useState(null)

	let {
		loading: loadingGet,
		error: errorGet,
		errorNetwork,
		data: hiveGet,
	} = useQuery(HIVE_QUERY, { variables: { id: +hiveId } })

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId])
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	const box = useLiveQuery(() => getBox(+boxId), [boxId])
	const boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId])

	let errorMsg

	// inline error from deeper components
	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}
	else if (errorGet) {
		errorMsg = <ErrorMsg error={errorGet} />
	}
	else if (errorNetwork) {
		errorMsg = <ErrorMsg error={errorNetwork} />
	}


	if (!hive || loadingGet) {
		return <Loader />
	}

	let okMsg

	let breadcrumbs = [
		{
			name: `Apiary ${apiary.name}`,
			uri: `/apiaries/edit/${apiaryId}`,
		},
		{
			name: `Hive ${hive.name}`,
			uri: `/apiaries/${apiaryId}/hives/${hive.id}`,
		},
	]

	if (box) {
		if (box.type === boxTypes.GATE) {
			breadcrumbs.push({
				'name': `Entrance #${box.id}`,
				uri: `/apiaries/${apiaryId}/hives/${hive.id}/box/${box.id}`,
			})
		} else {
			breadcrumbs.push({
				'name': `Box #${box.id}`,
				uri: `/apiaries/${apiaryId}/hives/${hive.id}/box/${box.id}`,
			})
		}
	}

	return (
		<div>
			<HiveNavigationPanel
				items={breadcrumbs}
			/>
			<ErrorGeneral />

			{errorMsg}
			{okMsg}

			<HiveEditDetails hiveId={hiveId} onError={onError} />

			<div className={styles.boxesFrameWrap}>
				<div className={styles.boxesWrap}>
					<Boxes
						onError={onError}
						apiaryId={apiaryId}
						hiveId={hive.id}
						boxes={boxes}
						boxId={boxId}
						frameId={frameId}
						frameSideId={frameSideId}
					/>
				</div>

				<div className={styles.frameWrap}>
					<Frame
						onError={onError}
						apiaryId={apiaryId}
						boxId={boxId}
						frameId={frameId}
						hiveId={hiveId}
						frameSideId={frameSideId}
					/>
				</div>

				{box && box.type === boxTypes.GATE &&
					<div className={styles.gateCameraWrap}>
						<div style="background:#0060d6;color:white;padding:10px;">
							Run app from the phone to stream video over good network connection.
							Position it above hive entrance. Use green landing board.
						</div>
						<div style="border:1px solid black;padding:10px;">
							<CameraCapture boxId={boxId} />
						</div>
					</div>
				}
			</div>
		</div>
	)
}
