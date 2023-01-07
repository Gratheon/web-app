import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import colors from '@/components/colors'
import { useMutation, useQuery } from '@/components/api'
import { getFrameSide } from '@/components/models/frameSide'
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
	hiveId,
	boxId,
	frameId,
	frameSide,
}) {

	let [expanded, expand] = useState(false)

	const frameSideObj = useLiveQuery(() => getFrameSide({
		frameId: frameId ? +frameId : -1,
		frameSide,
	}), [frameId]);

	if(!frameSideObj){
		return <Loading />
	}

	let {
		loading: loadingGet,
		data: frameSideFileRelDetails,
	} = useQuery(FRAME_SIDE_QUERY, { variables: { frameSideId: frameSideObj.id } });

	const frameSideFile = useLiveQuery(() => getFrameSideFile({
		frameSideId: frameSideObj.id,
	}), [frameId, frameSide]);
	
	const file = useLiveQuery(() => getFile(frameSideFile?.fileId ? frameSideFile?.fileId : -1), [frameId, frameSide]);

	if (loadingGet) {
		return <Loading />
	}

	function onFrameSideStatChange(){}
	function onUpload(){}
	function onFrameClose(){}
	function onQueenToggle(){}

	const [linkFileToFrame] = useMutation(LINK_FILE_TO_FRAME)

	function onResize(key, value) {
		let total =
			frameSide.broodPercent +
			frameSide.cappedBroodPercent +
			frameSide.droneBroodPercent +
			frameSide.honeyPercent +
			frameSide.pollenPercent

		// if (total <= 100) {
		// 	onFrameSideStatChange(key, Math.round(1 * value))
		// } else if (total > 100) {
		// 	onFrameSideStatChange(key, Math.floor((100 * value) / total))
		// 	if (key !== 'broodPercent')
		// 		onFrameSideStatChange(
		// 			'broodPercent',
		// 			Math.round((100 * frameSide.broodPercent) / total)
		// 		)
		// 	if (key !== 'cappedBroodPercent')
		// 		onFrameSideStatChange(
		// 			'cappedBroodPercent',
		// 			Math.round((100 * frameSide.cappedBroodPercent) / total)
		// 		)
		// 	if (key !== 'droneBroodPercent')
		// 		onFrameSideStatChange(
		// 			'droneBroodPercent',
		// 			Math.round((100 * frameSide.droneBroodPercent) / total)
		// 		)
		// 	if (key !== 'honeyPercent')
		// 		onFrameSideStatChange(
		// 			'honeyPercent',
		// 			Math.round((100 * frameSide.honeyPercent) / total)
		// 		)
		// 	if (key !== 'pollenPercent')
		// 		onFrameSideStatChange(
		// 			'pollenPercent',
		// 			Math.round((100 * frameSide.pollenPercent) / total)
		// 		)
		// }
	}

	const extraButtons = (
		<div style={{ display: 'flex' }}>
			<Button onClick={onFrameClose}>Close</Button>
			<Button title="Toggle queen" onClick={onQueenToggle}>
				<CrownIcon fill={frameSideObj.queenDetected ? 'white' : '#555555'} />
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
		<div style={{ marginLeft: 15 }}>
			<div className={styles.body}>
				<DrawingCanvas
					imageUrl={file.url}
					detectedObjects={frameSideFile.detectedObjects ? frameSideFile?.detectedObjects : []}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={(strokeHistory) => {
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
							percent={frameSideObj.broodPercent}
							onChange={(e) => onResize('broodPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Capped Brood'}
							color={colors.cappedBroodColor}
							percent={frameSideObj.cappedBroodPercent}
							onChange={(e) => onResize('cappedBroodPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Drone brood'}
							color={colors.droneBroodColor}
							percent={frameSideObj.droneBroodPercent}
							onChange={(e) => onResize('droneBroodPercent', e.target.value)}
						/>
						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Honey'}
							color={colors.honeyColor}
							percent={frameSideObj.honeyPercent}
							onChange={(e) => onResize('honeyPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Pollen'}
							color={colors.pollenColor}
							percent={frameSideObj.pollenPercent}
							onChange={(e) => onResize('pollenPercent', e.target.value)}
						/>
					</div>

					{extraButtons}
				</DrawingCanvas>
			</div>
		</div>
	)
}
