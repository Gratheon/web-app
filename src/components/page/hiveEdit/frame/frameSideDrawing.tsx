import React, { useMemo, useState } from 'react'
import debounce from 'lodash.debounce'

import { gql, useMutation, useSubscription } from '@/components/api'
import { toggleQueen } from '@/components/models/frameSideFile'
import { updateFrameSideFile } from '@/components/models/frameSideFile'

import Loading from '@/components/shared/loader'
import ErrorMessage from '@/components/shared/messageError'

import styles from './styles.less'
import DrawingCanvas from './drawingCanvas'
import MetricList from './metricList'
import Button from '@/components/shared/button'
import QueenIcon from '@/icons/queenIcon'
import Checkbox from '@/icons/checkbox'
import T from '@/components/shared/translate'
import { getFrameSideCells, updateFrameStat } from '@/components/models/frameSideCells'

export default function FrameSideDrawing({
	file,
	frameSide,
	frameSideCells,
	frameSideFile,
	frameId,
	frameSideId,
	extraButtons,
}) {

	if (!frameId || !frameSideId) {
		return
	}

	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)

	if (!frameSide || !frameSideFile || frameRemoving) {
		return <Loading />
	}

	useSubscription(gql`subscription onFrameSideBeesPartiallyDetected($frameSideId: String){
			onFrameSideBeesPartiallyDetected(frameSideId:$frameSideId){
				delta
				detectedQueenCount
				detectedWorkerBeeCount
				detectedDroneCount
				isBeeDetectionComplete
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			console.log({response})
			frameSideFile.detectedBees = [
				...frameSideFile.detectedBees,
				...response.onFrameSideBeesPartiallyDetected.delta
			]

			frameSideFile.detectedQueenCount = response.onFrameSideBeesPartiallyDetected.detectedQueenCount
			frameSideFile.detectedWorkerBeeCount = response.onFrameSideBeesPartiallyDetected.detectedWorkerBeeCount
			frameSideFile.detectedDroneCount = response.onFrameSideBeesPartiallyDetected.detectedDroneCount
			frameSideFile.isBeeDetectionComplete = response.onFrameSideBeesPartiallyDetected.isBeeDetectionComplete

			updateFrameSideFile(frameSideFile)
		}
	})

	useSubscription(gql`subscription onFrameSideResourcesDetected($frameSideId: String){
			onFrameSideResourcesDetected(frameSideId:$frameSideId){
				delta
				isCellsDetectionComplete

				broodPercent
				cappedBroodPercent
				eggsPercent
				pollenPercent
				honeyPercent
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedCells = [
				...frameSideFile.detectedCells,
				...response.onFrameSideResourcesDetected.delta
			]

			frameSideFile.isCellsDetectionComplete = response.onFrameSideResourcesDetected.isCellsDetectionComplete
			
			frameSideFile.broodPercent = response.onFrameSideResourcesDetected.broodPercent
			frameSideFile.cappedBroodPercent = response.onFrameSideResourcesDetected.cappedBroodPercent
			frameSideFile.eggsPercent = response.onFrameSideResourcesDetected.eggsPercent
			frameSideFile.pollenPercent = response.onFrameSideResourcesDetected.pollenPercent
			frameSideFile.honeyPercent = response.onFrameSideResourcesDetected.honeyPercent

			updateFrameSideFile(frameSideFile)
		}
	})

	useSubscription(gql`subscription onFrameQueenCupsDetected($frameSideId: String){
			onFrameQueenCupsDetected(frameSideId:$frameSideId){
				delta
				isQueenCupsDetectionComplete
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedQueenCups = [
				...frameSideFile.detectedQueenCups,
				...response.onFrameQueenCupsDetected.delta
			]

			frameSideFile.isQueenCupsDetectionComplete = response.onFrameQueenCupsDetected.isQueenCupsDetectionComplete
			updateFrameSideFile(frameSideFile)
		}
	})

	let [frameSideCellsMutate, { error: errorFrameSide }] = useMutation(
		gql`mutation updateFrameSideCells($cells: FrameSideCellsInput!) {
			updateFrameSideCells(cells: $cells)
			}`)
			
	const onFrameSideStatChange = useMemo(
		() =>
			debounce(async function (key: string, percent: number) {
				let frameSide2 = await getFrameSideCells(frameSideId)
				frameSide2 = await updateFrameStat(frameSide2, key, percent)

				await frameSideCellsMutate({
					cells: {
						id: frameSide2.id,
						pollenPercent: frameSide2.pollenPercent,
						honeyPercent: frameSide2.honeyPercent,
						eggsPercent: frameSide2.eggsPercent,
						cappedBroodPercent: frameSide2.cappedBroodPercent,
						broodPercent: frameSide2.broodPercent,
					},
				})
			}, 300),
		[frameSideId]
	)

	async function onQueenToggle() {
		let fsf = await toggleQueen(frameSideFile)
		// await frameSideMutate({
		// 	frameSideFile: {
		// 		id: frameSide.id,
		// 		queenDetected: fsf.queenDetected,
		// 	},
		// })
	}

	let [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`mutation filesStrokeEditMutation($files: [FilesUpdateInput]) { 
		filesStrokeEditMutation(files: $files) 
		}`)

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
			<Checkbox on={frameSide.queenDetected} />
			<span><T ctx="this is a button that toggles visibility of bee queen on an image">Queen</T></span>
			<QueenIcon size={14} color={'white'} />
		</Button>
	)


	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<ErrorMessage error={errorFrameSide || errorStrokes} />

				<DrawingCanvas
					imageUrl={file.url}
					resizes={file.resizes}
					extraButtons={extraButtons}
					frameMetrics={<MetricList
						onFrameSideStatChange={onFrameSideStatChange}
						frameSideCells={frameSideCells} />}

					detectedQueenCups={frameSideFile.detectedQueenCups}
					detectedBees={frameSideFile.detectedBees}
					detectedCells={frameSideFile.detectedCells}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
					frameSideFile={frameSideFile}
					queenButton={queenButton}
				/>
			</div>
		</div>
	)
}