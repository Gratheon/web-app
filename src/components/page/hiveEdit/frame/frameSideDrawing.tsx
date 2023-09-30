import React, { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import debounce from 'lodash.debounce'

import { gql, useMutation, useQuery, useSubscription } from '@/components/api'
import {
	getFrameSide,
	toggleQueen,
	updateFrameStat,
} from '@/components/models/frameSide'
import { getFrameSideFile, updateFrameSideFile } from '@/components/models/frameSideFile'
import { getFile } from '@/components/models/files'

import Button from '@/components/shared/button'
import Loading from '@/components/shared/loader'
import CrownIcon from '@/icons/crownIcon'
import ErrorMessage from '@/components/shared/messageError'

import styles from './styles.less'
import DrawingCanvas from './drawingCanvas'
import MetricList from './metricList'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'
import MessageNotFound from '@/components/shared/messageNotFound'

export default function FrameSideDrawing({
	hiveId,
	frameId,
	frameSideId,
}) {

	if (!frameId || !frameSideId) {
		return
	}

	let [estimatedDetectionTimeSec, setEstimatedDetectionTimeSec] = useState(0)
	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)

	let file, frameSideFile, frameSide

	frameSide = useLiveQuery(function () {
		return getFrameSide(+frameSideId)
	}, [frameSideId], null);

	frameSideFile = useLiveQuery(function () {
		if (!frameSide) return null

		return getFrameSideFile({
			frameSideId: frameSide.id,
		})
	}, [frameSide?.id], null);

	file = useLiveQuery(function () {
		if (!frameSideFile?.fileId) return null

		return getFile(frameSideFile.fileId)
	}, [frameSideFile?.fileId], null);


	if (!frameSide || !file || !frameSideFile) {
		let { loading: loadingGet, data: frameSideFileRelDetails } = useQuery(
			FRAME_SIDE_QUERY,
			{ variables: { frameSideId } }
		)

		setEstimatedDetectionTimeSec(frameSideFileRelDetails?.hiveFrameSideFile?.estimatedDetectionTimeSec)

		if (loadingGet) {
			return <Loading />
		}

		if (!frameSide) {
			return <MessageNotFound msg="Frame not found" />
		}
	}


	if (!frameSide || !frameSideFile || frameRemoving) {
		return <Loading />
	}

	useSubscription(gql`subscription onFrameSideBeesPartiallyDetected($frameSideId: String){
			onFrameSideBeesPartiallyDetected(frameSideId:$frameSideId){
				delta
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedBees = [
				...frameSideFile.detectedBees,
				...response.onFrameSideBeesPartiallyDetected.delta
			]

			updateFrameSideFile(frameSideFile)
		}
	})

	useSubscription(gql`subscription onFrameSideBeesPartiallyDetected($frameSideId: String){
			onFrameSideResourcesDetected(frameSideId:$frameSideId){
				delta
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedFrameResources = [
				...frameSideFile.detectedFrameResources,
				...response.onFrameSideResourcesDetected.delta
			]

			updateFrameSideFile(frameSideFile)
		}
	})

	let [frameSideMutate, { error: errorFrameSide }] = useMutation(gql`mutation updateFrameSide($frameSide: FrameSideInput!) { updateFrameSide(frameSide: $frameSide) }`)
	const onFrameSideStatChange = useMemo(
		() =>
			debounce(async function (key: string, percent: number) {
				let frameSide2 = await getFrameSide(+frameSideId)
				frameSide2 = await updateFrameStat(frameSide2, key, percent)

				await frameSideMutate({
					frameSide: {
						id: frameSide2.id,
						pollenPercent: frameSide2.pollenPercent,
						honeyPercent: frameSide2.honeyPercent,
						eggsPercent: frameSide2.eggsPercent,
						cappedBroodPercent: frameSide2.cappedBroodPercent,
						broodPercent: frameSide2.broodPercent,
						queenDetected: frameSide2.queenDetected,
					},
				})
			}, 300),
		[frameSideId]
	)

	async function onQueenToggle() {
		frameSide = await toggleQueen(frameSide)
		await frameSideMutate({
			frameSide: {
				id: frameSide.id,
				pollenPercent: frameSide.pollenPercent,
				honeyPercent: frameSide.honeyPercent,
				eggsPercent: frameSide.eggsPercent,
				cappedBroodPercent: frameSide.cappedBroodPercent,
				broodPercent: frameSide.broodPercent,
				queenDetected: frameSide.queenDetected,
			},
		})
	}

	let [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`mutation filesStrokeEditMutation($files: [FilesUpdateInput]) { filesStrokeEditMutation(files: $files) }`)
	async function onStrokeHistoryUpdate(strokeHistory) {
		filesStrokeEditMutate({
			files: [{
				frameSideId: frameSide.id,
				fileId: file.id,
				strokeHistory
			}]
		})

		frameSideFile.strokeHistory = strokeHistory;
		updateFrameSideFile(
			frameSideFile
		)
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<ErrorMessage error={errorFrameSide || errorStrokes} />

				<div style={{ display: 'flex', flexGrow: '1' }}>
					<MetricList
						onFrameSideStatChange={onFrameSideStatChange}
						estimatedDetectionTimeSec={estimatedDetectionTimeSec}
						frameSideFile={frameSideFile}
						frameSide={frameSide} />
					<div style={{ display: 'flex', flexDirection: 'row-reverse', flexGrow: 1 }}>
						<Button title="Toggle queen" onClick={onQueenToggle}>
							<CrownIcon fill={frameSide.queenDetected ? 'gold' : '#555555'} stroke="gray" />
							<span>Toggle Queen</span>
						</Button>
					</div>
				</div>
				<DrawingCanvas
					imageUrl={file.url}
					resizes={file.resizes}
					detectedBees={frameSideFile.detectedBees}
					detectedFrameResources={frameSideFile.detectedFrameResources}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
				/>
			</div>
		</div>
	)
}