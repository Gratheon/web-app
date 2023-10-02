import React, { useMemo, useState } from 'react'
import debounce from 'lodash.debounce'

import { gql, useMutation, useSubscription } from '@/components/api'
import {
	getFrameSide,
	toggleQueen,
	updateFrameStat,
} from '@/components/models/frameSide'
import { getFrameSideFile, updateFrameSideFile } from '@/components/models/frameSideFile'

import Loading from '@/components/shared/loader'
import ErrorMessage from '@/components/shared/messageError'

import styles from './styles.less'
import DrawingCanvas from './drawingCanvas'
import MetricList from './metricList'
import Button from '@/components/shared/button'
import QueenIcon from '@/icons/queenIcon'

export default function FrameSideDrawing({
	file,
	frameSide,
	frameSideFile,
	frameId,
	frameSideId,
}) {

	if (!frameId || !frameSideId) {
		return
	}

	let [estimatedDetectionTimeSec, setEstimatedDetectionTimeSec] = useState(0)
	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)

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

	useSubscription(gql`subscription onFrameQueenCupsDetected($frameSideId: String){
			onFrameQueenCupsDetected(frameSideId:$frameSideId){
				delta
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedQueenCups = [
				...frameSideFile.detectedQueenCups,
				...response.onFrameQueenCupsDetected.delta
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


	const queenButton = (
		<Button title="Toggle queen" onClick={onQueenToggle}>
			<QueenIcon />
			<span>Queen</span>
		</Button>
	)


	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<ErrorMessage error={errorFrameSide || errorStrokes} />

				<div style={{ display: 'flex', flexGrow: '1' }}>
					<MetricList
						onFrameSideStatChange={onFrameSideStatChange}
						estimatedDetectionTimeSec={estimatedDetectionTimeSec}
						frameSide={frameSide} />
				</div>
				<DrawingCanvas
					imageUrl={file.url}
					resizes={file.resizes}

					detectedQueenCups={frameSideFile.detectedQueenCups}
					detectedBees={frameSideFile.detectedBees}
					detectedFrameResources={frameSideFile.detectedFrameResources}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
					frameSideFile={frameSideFile}
					queenButton={queenButton}
				/>
			</div>
		</div>
	)
}