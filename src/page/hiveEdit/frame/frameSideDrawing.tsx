import React, { useMemo, useState } from 'react'

import { gql, useMutation, useSubscription } from '../../../api'
import { updateFrameSideFile } from '../../../models/frameSideFile.ts'

import Loading from '../../../shared/loader'
import ErrorMessage from '../../../shared/messageError'

import styles from './styles.module.less'
import DrawingCanvas from './drawingCanvas'

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

	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)

	if (!frameSide || !frameSideFile || frameRemoving) {
		return <Loading />
	}

	useSubscription(
		gql`
			subscription onFrameSideBeesPartiallyDetected($frameSideId: String) {
				onFrameSideBeesPartiallyDetected(frameSideId: $frameSideId) {
					delta
					detectedQueenCount
					detectedWorkerBeeCount
					detectedDroneCount
					isBeeDetectionComplete
				}
			}
		`,
		{ frameSideId },
		(_, response) => {
			if (response) {
				frameSideFile.detectedBees = [
					...frameSideFile.detectedBees,
					...response.onFrameSideBeesPartiallyDetected.delta,
				]

				frameSideFile.detectedQueenCount =
					response.onFrameSideBeesPartiallyDetected.detectedQueenCount
				frameSideFile.detectedWorkerBeeCount =
					response.onFrameSideBeesPartiallyDetected.detectedWorkerBeeCount
				frameSideFile.detectedDroneCount =
					response.onFrameSideBeesPartiallyDetected.detectedDroneCount
				frameSideFile.isBeeDetectionComplete =
					response.onFrameSideBeesPartiallyDetected.isBeeDetectionComplete

				updateFrameSideFile(frameSideFile)
			}
		}
	)

	useSubscription(
		gql`
			subscription onFrameSideResourcesDetected($frameSideId: String) {
				onFrameSideResourcesDetected(frameSideId: $frameSideId) {
					delta
					isCellsDetectionComplete

					broodPercent
					cappedBroodPercent
					eggsPercent
					pollenPercent
					honeyPercent
				}
			}
		`,
		{ frameSideId },
		(_, response) => {
			if (response) {
				frameSideFile.detectedCells = [
					...frameSideFile.detectedCells,
					...response.onFrameSideResourcesDetected.delta,
				]

				frameSideFile.isCellsDetectionComplete =
					response.onFrameSideResourcesDetected.isCellsDetectionComplete

				frameSideFile.broodPercent =
					response.onFrameSideResourcesDetected.broodPercent
				frameSideFile.cappedBroodPercent =
					response.onFrameSideResourcesDetected.cappedBroodPercent
				frameSideFile.eggsPercent =
					response.onFrameSideResourcesDetected.eggsPercent
				frameSideFile.pollenPercent =
					response.onFrameSideResourcesDetected.pollenPercent
				frameSideFile.honeyPercent =
					response.onFrameSideResourcesDetected.honeyPercent

				updateFrameSideFile(frameSideFile)
			}
		}
	)

	useSubscription(
		gql`
			subscription onFrameQueenCupsDetected($frameSideId: String) {
				onFrameQueenCupsDetected(frameSideId: $frameSideId) {
					delta
					isQueenCupsDetectionComplete
				}
			}
		`,
		{ frameSideId },
		(_, response) => {
			if (response) {
				frameSideFile.detectedQueenCups = [
					...frameSideFile.detectedQueenCups,
					...response.onFrameQueenCupsDetected.delta,
				]

				frameSideFile.isQueenCupsDetectionComplete =
					response.onFrameQueenCupsDetected.isQueenCupsDetectionComplete
				updateFrameSideFile(frameSideFile)
			}
		}
	)

	let [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`
		mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
			filesStrokeEditMutation(files: $files)
		}
	`)

	async function onStrokeHistoryUpdate(strokeHistory) {
		filesStrokeEditMutate({
			files: [
				{
					frameSideId: frameSide.id,
					fileId: file.id,
					strokeHistory,
				},
			],
		})

		frameSideFile.strokeHistory = strokeHistory
		updateFrameSideFile(frameSideFile)
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<ErrorMessage error={errorStrokes} />

				<DrawingCanvas
					imageUrl={file.url}
					resizes={file.resizes}
					detectedQueenCups={frameSideFile.detectedQueenCups}
					detectedBees={frameSideFile.detectedBees}
					detectedCells={frameSideFile.detectedCells}
					detectedVarroa={frameSideFile.detectedVarroa}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
					frameSideFile={frameSideFile}
					frameSide={frameSide}
				/>
			</div>
		</div>
	)
}

