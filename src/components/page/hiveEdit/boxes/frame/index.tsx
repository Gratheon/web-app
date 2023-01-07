import React, { useState } from 'react'

import styles from './styles.less'
import colors from '../../../../colors'
import UploadFile from './uploadFile'
import ResourceEditRow from './resourceEditRow'
import { useMutation, useQuery } from '../../../../api'
import DrawingCanvas from './drawingCanvas'
import { getFrameSide } from '../../../../models/frameSide'
import Button from '../../../../shared/button'
import CrownIcon from '../../../../../icons/crownIcon'

import LINK_FILE_TO_FRAME from './_api/addFileToFrameSideMutation.graphql'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'
import Loading from '../../../../shared/loader'
import { setFileStroke } from '../../../../models/files'
import { useLiveQuery } from 'dexie-react-hooks'

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
	}), [boxId]);

	if(!frameSideObj){
		return <Loading />
	}

	let {id:frameSideId} = frameSideObj;

	let {
		loading: loadingGet,
		data: frameSideFileRelDetails,
	} = useQuery(FRAME_SIDE_QUERY, { variables: { frameSideId } });

	let frameSideFileRel = null

	if (loadingGet) {
		return <Loading />
	}

	function onFrameSideStatChange(){}
	function onUpload(){}
	function onFrameClose(){}
	function onQueenToggle(){}

	// const cachedFileRel = getFrameSideFile({
	// 	frameSideId: +frameSideId,
	// 	hiveId: +hiveId,
	// })

	// let frameSideFileRel = {
	// 	...cachedFileRel,
	// 	...frameSideFileRelDetails.hiveFrameSideFile,
	// }

	// if (cachedFileRel) {
	// 	cachedFileRel.strokeHistory = frameSideFileRel.strokeHistory
	// }

	const [linkFileToFrame] = useMutation(LINK_FILE_TO_FRAME)

	function onResize(key, value) {
		let total =
			frameSide.broodPercent +
			frameSide.cappedBroodPercent +
			frameSide.droneBroodPercent +
			frameSide.honeyPercent +
			frameSide.pollenPercent

		if (total <= 100) {
			onFrameSideStatChange(key, Math.round(1 * value))
		} else if (total > 100) {
			onFrameSideStatChange(key, Math.floor((100 * value) / total))
			if (key !== 'broodPercent')
				onFrameSideStatChange(
					'broodPercent',
					Math.round((100 * frameSide.broodPercent) / total)
				)
			if (key !== 'cappedBroodPercent')
				onFrameSideStatChange(
					'cappedBroodPercent',
					Math.round((100 * frameSide.cappedBroodPercent) / total)
				)
			if (key !== 'droneBroodPercent')
				onFrameSideStatChange(
					'droneBroodPercent',
					Math.round((100 * frameSide.droneBroodPercent) / total)
				)
			if (key !== 'honeyPercent')
				onFrameSideStatChange(
					'honeyPercent',
					Math.round((100 * frameSide.honeyPercent) / total)
				)
			if (key !== 'pollenPercent')
				onFrameSideStatChange(
					'pollenPercent',
					Math.round((100 * frameSide.pollenPercent) / total)
				)
		}
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

	if (!frameSideFileRel.file) {
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
					imageUrl={frameSideFileRel.file.url}
					detectedObjects={frameSideFileRel.detectedObjects}
					strokeHistory={frameSideFileRel.strokeHistory}
					onStrokeHistoryUpdate={(strokeHistory) => {
						setFileStroke({
							frameSideId: +frameSideId,
							hiveId: +frameSideId,
							strokeHistory,
						})
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
