import React, { useState } from 'react'

import styles from './styles.less'
import colors from '../../../../colors'
import UploadFile from './uploadFile'
import ResourceEditRow from './resourceEditRow'
import { useMutation, useQuery } from '../../../../api'
import DrawingCanvas from './drawingCanvas'
import { getFrameSideFile } from '../../../../../storage/files'
import Button from '../../../../shared/button'
import CrownIcon from '../../../../../icons/crownIcon'

import LINK_FILE_TO_FRAME from './_api/addFileToFrameSideMutation.graphql'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'
import Loading from '../../../../shared/loader'
import { setFileStroke } from '../../../../../storage/files';

export default ({
	frameSide,
	frameSideId,
	onUpload,
	onFrameSideStatChange,
	hiveId,

	onFrameClose,
	onQueenToggle,
}) => {
	let [expanded, expand] = useState(false)

	let {
		loading: loadingGet,
		// error: errorGet,
		data: frameSideFileRelDetails,
	} = useQuery(FRAME_SIDE_QUERY, { variables: { frameSideId } })

	if (loadingGet) {
		return <Loading />
	}

	const cachedFileRel = getFrameSideFile({
		frameSideId,
		hiveId,
	})

	let frameSideFileRel = {
		...cachedFileRel,
		...frameSideFileRelDetails.hiveFrameSideFile,
	}

	if (cachedFileRel) {
		cachedFileRel.strokeHistory = frameSideFileRel.strokeHistory
	}

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
		<div style="display:flex;">
			<Button onClick={onFrameClose}>Close</Button>
			<Button title="Toggle queen" onClick={onQueenToggle}>
				<CrownIcon fill={frameSide.queenDetected ? 'white' : '#555555'} />
				Toggle Queen
			</Button>
		</div>
	)

	if (!frameSideFileRel.file) {
		return (
			<div style="flex-grow:10; padding-left:15px;">
				{extraButtons}
				<UploadFile
					onUpload={(data) => {
						if (frameSide.id) {
							linkFileToFrame({
								variables: {
									fileId: data.id,
									frameSideId: frameSide.id,
									hiveId,
								},
							})
						}
						onUpload(data)
					}}
				/>
			</div>
		)
	}

	return (
		<div style="margin-left:15px;">
			<div className={styles.body}>
				<DrawingCanvas
					imageUrl={frameSideFileRel.file.url}
					detectedObjects={frameSideFileRel.detectedObjects}
					strokeHistory={frameSideFileRel.strokeHistory}
					onStrokeHistoryUpdate={(strokeHistory) => {
						setFileStroke({
							frameSideId,
							hiveId,
							strokeHistory
						});
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
