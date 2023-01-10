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

import { getBoxes } from '@/components/models/boxes'
import { getHive } from '@/components/models/hive'
import Frame from './frame'

export default function HiveEditForm() {
	let { apiaryId, hiveId, boxId, frameId, frameSideId } = useParams()
	let [error, onError] = useState(null)

	let {
		loading: loadingGet,
		error: errorGet,
		data: hiveGet,
	} = useQuery(HIVE_QUERY, { variables: { id: +hiveId } })

	// let [updateFileStroke] = useMutation(FILE_STROKE_EDIT_MUTATION)

	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	const boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId])

	let errorMsg

	// inline error from deeper components
	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	if (errorGet) {
		return <ErrorMsg error={errorGet} />
	}

	if (!hive || loadingGet) {
		return <Loader />
	}

	let okMsg

	return (
		<div>
			<HiveNavigationPanel
				items={[
					{
						name: 'apiary',
						uri: `/apiaries/edit/${apiaryId}`,
					},
					{
						name: hive.name,
						uri: `/apiaries/${apiaryId}/hives/${hive.id}`,
					},
				]}
			/>
			<ErrorGeneral />

			{errorMsg}
			{okMsg}

			<HiveEditDetails hiveId={hiveId} />

			<div style={{ display: 'flex', padding: '0 20px' }}>
				<Boxes
					onError={onError}
					apiaryId={apiaryId}
					hiveId={hive.id}
					boxes={boxes}
					boxId={boxId}
					frameId={frameId}
					frameSideId={frameSideId}
				/>

				<Frame
					apiaryId={apiaryId}
					boxId={boxId}
					frameId={frameId}
					hiveId={hiveId}
					frameSideId={frameSideId}
				/>
			</div>
		</div>
	)
}
