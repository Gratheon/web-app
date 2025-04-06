import React, { useMemo } from 'react' // Removed useState, useEffect

import { gql, useMutation, useSubscription } from '../../../api'
import { updateFrameSideFile, FrameSideFile } from '../../../models/frameSideFile.ts'

import Loading from '../../../shared/loader'
import ErrorMessage from '../../../shared/messageError'

import styles from './styles.module.less'
import DrawingCanvas from './drawingCanvas'

export default function FrameSideDrawing({
	file,
	frameSide,
	frameSideFile, // Use the prop directly, renamed back
	frameId,
	frameSideId,
}) {
	if (!frameId || !frameSideId) {
		return
	}

	// Removed local state and useEffect

	// Use the prop directly for checks and rendering
	if (!frameSide || !frameSideFile) {
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
		// Only update IndexedDB
		(_, response) => {
			if (response && frameSideFile) { // Check prop directly
				const update = response.onFrameSideBeesPartiallyDetected;
				// Create the new state based on the current prop value
				const newState = {
					...frameSideFile,
					detectedBees: [
						...(frameSideFile.detectedBees || []),
						...(update.delta || []),
					],
					detectedQueenCount: update.detectedQueenCount,
					detectedWorkerBeeCount: update.detectedWorkerBeeCount,
					detectedDroneCount: update.detectedDroneCount,
					isBeeDetectionComplete: update.isBeeDetectionComplete,
				};
				// Only update IndexedDB, relying on parent's useLiveQuery to update prop
				updateFrameSideFile(newState);
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
		// Only update IndexedDB
		(_, response) => {
			if (response && frameSideFile) { // Check prop directly
				const update = response.onFrameSideResourcesDetected;
				const newState = {
					...frameSideFile,
					detectedCells: [
						...(frameSideFile.detectedCells || []),
						...(update.delta || []),
					],
					isCellsDetectionComplete: update.isCellsDetectionComplete,
					broodPercent: update.broodPercent,
					cappedBroodPercent: update.cappedBroodPercent,
					eggsPercent: update.eggsPercent,
					pollenPercent: update.pollenPercent,
					honeyPercent: update.honeyPercent,
				};
				updateFrameSideFile(newState); // Only update IndexedDB
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
		// Only update IndexedDB
		(_, response) => {
			if (response && frameSideFile) { // Check prop directly
				const update = response.onFrameQueenCupsDetected;
				const newState = {
					...frameSideFile,
					detectedQueenCups: [
						...(frameSideFile.detectedQueenCups || []),
						...(update.delta || []),
					],
					isQueenCupsDetectionComplete: update.isQueenCupsDetectionComplete,
				};
				updateFrameSideFile(newState); // Only update IndexedDB
			}
		}
	)

	// Subscription for Queen Detection (Newly Added)
	useSubscription(
		gql`
			subscription onFrameQueenDetected($frameSideId: String) {
				onFrameQueenDetected(frameSideId: $frameSideId) {
					delta # Array of detected queen objects {n: '3', c: confidence, x, y, w, h}
					isQueenDetectionComplete # Boolean flag indicating if detection process is complete
				}
			}
		`,
		{ frameSideId },
		// Only update IndexedDB
		(_, response) => {
			console.log('onFrameQueenDetected: Received response:', response);
			if (response?.onFrameQueenDetected && frameSideFile) { // Check prop directly
				const queenData = response.onFrameQueenDetected;
				console.log('onFrameQueenDetected: Processing data:', queenData);
				let newDetectedBees = frameSideFile.detectedBees || [];
				let newQueenCount = frameSideFile.detectedQueenCount || 0;

				if (queenData.delta && queenData.delta.length > 0) {
					newDetectedBees = [...newDetectedBees, ...queenData.delta];
					newQueenCount += queenData.delta.length;
				}

				const newState = {
					...frameSideFile,
					detectedBees: newDetectedBees,
					detectedQueenCount: newQueenCount,
					isQueenDetectionComplete: true
				};
				console.log('onFrameQueenDetected: Updating IndexedDB with state:', newState);

				// Only update IndexedDB
				updateFrameSideFile(newState);
			} else {
				console.log('onFrameQueenDetected: Skipping update (no response data or frameSideFile prop is null)');
			}
		}
	);

	// Removed state update for stroke history, assuming parent handles it or it's not needed here
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
		});

		// Only update IndexedDB for stroke history
		if (frameSideFile) {
			const newState = { ...frameSideFile, strokeHistory };
			updateFrameSideFile(newState); // Update IndexedDB
		}
	}

	// Use prop directly for rendering check
	if (!frameSideFile) {
		return <Loading />;
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
