import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from "dexie-react-hooks";

import { omitTypeName, useMutation, useQuery } from '../../api'
import Loader from '../../shared/loader'
import Boxes from './boxes'

import HIVE_QUERY from './_api/hiveQuery.graphql'
import HiveEditDetails from './editFormTop'
import HiveNavigationPanel from './breadcrumbs'
// import HIVE_EDIT_MUTATION from './_api/hiveEditMutation.graphql'
// import FILE_STROKE_EDIT_MUTATION from './_api/filesStrokeEditMutation.graphql'
import ErrorMsg from '../../shared/messageError'
import ErrorGeneral from '../../shared/messageErrorGlobal'
// import OkMsg from '../../shared/messageSuccess'

import { getBoxes } from '../../models/boxes'
import { getFrames } from '../../models/frames'
import { getHive } from '../../models/hive';

export default function HiveEditForm() {
	let { apiaryId, hiveId, boxId, frameId, frameSide } = useParams()
	let [error, onError] = useState(null);

	let navigate = useNavigate()
	let {
		loading: loadingGet,
		error: errorGet,
		data: hiveGet,
	} = useQuery(HIVE_QUERY, { variables: { id: +hiveId } })

	// let [updateHive, { loading: loadingUpdate, error, data }] = useMutation(HIVE_EDIT_MUTATION)
	// let [updateFileStroke] = useMutation(FILE_STROKE_EDIT_MUTATION)
	
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);
	const boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId]);

	let errorMsg

	// inline error from deeper components
	if(error){
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

			<HiveEditDetails hiveId={hiveId}/>

			<Boxes
				onError={onError}
				apiaryId={apiaryId}
				hiveId={hive.id}
				boxes={boxes}
				boxId={boxId}
				frameId={frameId}
				frameSide={frameSide}
			/>
		</div>
	)
}
