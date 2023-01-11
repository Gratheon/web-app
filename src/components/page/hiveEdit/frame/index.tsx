import React, { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import debounce from 'lodash.debounce'

import colors from '@/components/colors'
import { useMutation, useQuery } from '@/components/api'
import { getFrameSide, updateFrameStat } from '@/components/models/frameSide'
import Button from '@/components/shared/button'
import Loading from '@/components/shared/loader'
import CrownIcon from '@/icons/crownIcon'

import styles from './styles.less'
import UploadFile from './uploadFile'
import ResourceEditRow from './resourceEditRow'
import DrawingCanvas from './drawingCanvas'
import LINK_FILE_TO_FRAME from './_api/addFileToFrameSideMutation.graphql'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'
import { getFrameSideFile } from '@/components/models/frameSideFile'
import { getFile } from '@/components/models/files'

export default function Frame({
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,
}) {
	if(!frameId){
		return null;
	}
	let [expanded, expand] = useState(false)

	console.log('loading frameSide');
	const frameSide = useLiveQuery(() => getFrameSide({
		frameId: useLiveQuery ? +frameId : -1,
		frameSide: useLiveQuery ? frameSideId : -1
	}), [frameId, frameSideId]);

	if(!frameSide){
		return <Loading />
	}

	let {
		loading: loadingGet,
		data: frameSideFileRelDetails,
	} = useQuery(FRAME_SIDE_QUERY, { variables: { frameSideId: frameSide.id } });

	const frameSideFile = useLiveQuery(async () => await getFrameSideFile({
		frameSideId: frameSide.id,
	}), [frameId, frameSideId]);
	
	const file = useLiveQuery(() => getFile(frameSideFile?.fileId ? frameSideFile?.fileId : -1), [frameId, frameSide]);

	if (loadingGet) {
		return <Loading />
	}


	let [mutateHive] = useMutation(`mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
			__typename
		}
	}
`)
	const onFrameSideStatChange = useMemo(
		() =>
			debounce(async function (key: string, percent: number) {
				await updateFrameStat(frameSide, key, percent)
				// const name = v.target.value
				// await updateHive(+hiveId, { name })
				// await mutateHive({
				// 	hive: {
				// 		id: hiveId,
				// 		name,
				// 	},
				// })
			}, 300),
		[]
	)

	// function onFrameSideStatChange(key: string, percent: number){
	// 	console.log(onFrameSideStatChange, {key, percent});
	// }
	function onUpload(){}
	function onQueenToggle(){}

	const navigate = useNavigate();
	function onFrameClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, { replace: true })
	}

	const [linkFileToFrame] = useMutation(LINK_FILE_TO_FRAME)

	function onResize(key, value) {
		onFrameSideStatChange(key, Math.round(1 * value))
	}

	const extraButtons = (
		<div style={{ display: 'flex' }}>
			<Button onClick={onFrameClose}>Close</Button>
			<Button title="Toggle queen" onClick={onQueenToggle}>
				<CrownIcon fill={frameSide.queenDetected ? 'white' : '#555555'} />
				Toggle Queen
			</Button>
		</div>
	)

	if (!frameSideFile || !file) {
		return (
			<div style={{ flexGrow: 10, paddingLeft: 15 }}>
				{extraButtons}
				<UploadFile
					onUpload={(data) => {
						// if (frameSide.id) {
						// 	linkFileToFrame({
						// 		fileId: data.id,
						// 		frameSideId: frameSide.id,
						// 		hiveId,
						// 	})
						// }
						// onUpload(data)
					}}
				/>
			</div>
		)
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<DrawingCanvas
					imageUrl={file.url}
					detectedObjects={frameSideFile.detectedObjects ? frameSideFile?.detectedObjects : []}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={(strokeHistory) => {
						console.log('onStrokeHistoryUpdate', {strokeHistory});
						// setFileStroke({
						// 	frameSideId: +frameSideId,
						// 	hiveId: +frameSideId,
						// 	strokeHistory,
						// })
					}}
				>
					<div style={{ display: expanded ? 'block' : 'flex', flexGrow: '1' }}>
						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Brood'}
							color={colors.broodColor}
							percent={frameSide.broodPercent}
							onChange={(e) => onResize('broodPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Capped Brood'}
							color={colors.cappedBroodColor}
							percent={frameSide.cappedBroodPercent}
							onChange={(e) => onResize('cappedBroodPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Drone brood'}
							color={colors.droneBroodColor}
							percent={frameSide.droneBroodPercent}
							onChange={(e) => onResize('droneBroodPercent', e.target.value)}
						/>
						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Honey'}
							color={colors.honeyColor}
							percent={frameSide.honeyPercent}
							onChange={(e) => onResize('honeyPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Pollen'}
							color={colors.pollenColor}
							percent={frameSide.pollenPercent}
							onChange={(e) => onResize('pollenPercent', e.target.value)}
						/>
					</div>

					{extraButtons}
				</DrawingCanvas>
			</div>
		</div>
	)
}
