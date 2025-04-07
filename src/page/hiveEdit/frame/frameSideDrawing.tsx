import React, { useCallback } from 'react' // Removed useState, useEffect
import { useLiveQuery } from 'dexie-react-hooks' // Added useLiveQuery
import { gql, useMutation, useSubscription } from '@/api'
import { updateFrameSideFile, FrameSideFile, getFrameSideFile } from '@/models/frameSideFile' // Added getFrameSideFile
import { FrameSide as FrameSideType, getFrameSide, upsertFrameSide } from '@/models/frameSide'
import Loading from '@/shared/loader'
import ErrorMessage from '@/shared/messageError'
import DrawingCanvas from '@/page/hiveEdit/frame/drawingCanvas'
import styles from '@/page/hiveEdit/frame/styles.module.less'

// Define local type for the file prop
interface FilePropType {
	id: number | string;
	url: string;
	resizes?: { width: number; url: string }[];
}

interface FrameSideDrawingProps {
	file: FilePropType // Use the local type
	frameSide: FrameSideType
	frameSideFile: FrameSideFile | null | undefined
	frameId: string | number
	frameSideId: string | number
}

export default function FrameSideDrawing({
	file,
	frameSide,
	// Removed initialFrameSideFile prop as we fetch live data
	frameId,
	frameSideId,
}: FrameSideDrawingProps) {
	// Use useLiveQuery to get live data from Dexie
	const liveFrameSideFile = useLiveQuery(
		() => getFrameSideFile({ frameSideId: +frameSideId }),
		[frameSideId] // Re-run query if frameSideId changes
	)

	const handleBeesUpdate = useCallback((_, response) => {
		if (response?.onFrameSideBeesPartiallyDetected && liveFrameSideFile) { // Use liveFrameSideFile
			const update = response.onFrameSideBeesPartiallyDetected
			const newState = {
				...liveFrameSideFile, // Use liveFrameSideFile
				detectedBees: [
					...(liveFrameSideFile.detectedBees || []), // Corrected reference
					...(update.delta || []),
				],
				detectedQueenCount: update.detectedQueenCount,
				detectedWorkerBeeCount: update.detectedWorkerBeeCount,
				detectedDroneCount: update.detectedDroneCount,
				isBeeDetectionComplete: update.isBeeDetectionComplete,
			}
			updateFrameSideFile(newState) // Only update Dexie
			// setFrameSideFileData(newState) // Removed state update
		}
	}, [liveFrameSideFile]) // Dependency is now liveFrameSideFile

	const handleResourcesUpdate = useCallback((_, response) => {
		if (response?.onFrameSideResourcesDetected && liveFrameSideFile) { // Use liveFrameSideFile
			const update = response.onFrameSideResourcesDetected
			const newState = {
				...liveFrameSideFile, // Use liveFrameSideFile
				detectedCells: [
					...(liveFrameSideFile.detectedCells || []), // Corrected reference
					...(update.delta || []),
				],
				isCellsDetectionComplete: update.isCellsDetectionComplete,
				broodPercent: update.broodPercent,
				cappedBroodPercent: update.cappedBroodPercent,
				eggsPercent: update.eggsPercent,
				pollenPercent: update.pollenPercent,
				honeyPercent: update.honeyPercent,
			}
			updateFrameSideFile(newState) // Only update Dexie
			// setFrameSideFileData(newState) // Removed state update
		}
	}, [liveFrameSideFile]) // Dependency is now liveFrameSideFile

	const handleQueenCupsUpdate = useCallback((_, response) => {
		if (response?.onFrameQueenCupsDetected && liveFrameSideFile) { // Use liveFrameSideFile
			const update = response.onFrameQueenCupsDetected
			const newState = {
				...liveFrameSideFile, // Use liveFrameSideFile
				detectedQueenCups: [
					...(liveFrameSideFile.detectedQueenCups || []), // Corrected reference
					...(update.delta || []),
				],
				isQueenCupsDetectionComplete: update.isQueenCupsDetectionComplete,
			}
			updateFrameSideFile(newState) // Only update Dexie
			// setFrameSideFileData(newState) // Removed state update
		}
	}, [liveFrameSideFile]) // Dependency is now liveFrameSideFile

	const handleQueenUpdate = useCallback((_, response) => {
		console.log('onFrameQueenDetected: Received response:', response)
		if (response?.onFrameQueenDetected && liveFrameSideFile) { // Use liveFrameSideFile
			const queenData = response.onFrameQueenDetected
			console.log('onFrameQueenDetected: Processing data:', queenData)

			let newDetectedBees = liveFrameSideFile.detectedBees || [] // Use liveFrameSideFile
			let newQueenCount = liveFrameSideFile.detectedQueenCount || 0 // Use liveFrameSideFile

			if (queenData.delta && queenData.delta.length > 0) {
				newDetectedBees = [...newDetectedBees, ...queenData.delta]
				newQueenCount += queenData.delta.length
			}

			const newState = {
				...liveFrameSideFile, // Use liveFrameSideFile
				detectedBees: newDetectedBees,
				detectedQueenCount: newQueenCount,
				queenDetected: (queenData.delta && queenData.delta.length > 0) ? true : (liveFrameSideFile.queenDetected ?? false), // Use liveFrameSideFile
				isQueenDetectionComplete: queenData.isQueenDetectionComplete !== undefined
					? !!queenData.isQueenDetectionComplete
					: (liveFrameSideFile.isQueenDetectionComplete ?? false), // Use liveFrameSideFile
			}
			console.log('onFrameQueenDetected: Updating IndexedDB frameSideFile:', newState)
			updateFrameSideFile(newState) // Only update Dexie
			// setFrameSideFileData(newState) // Removed state update

			const aiFoundQueen = queenData.delta && queenData.delta.length > 0
			if (aiFoundQueen) {
				getFrameSide(+frameSideId).then(currentFrameSide => {
					if (currentFrameSide && !currentFrameSide.isQueenConfirmed) {
						console.log('onFrameQueenDetected: AI found queen and not confirmed, updating frameSide.isQueenConfirmed to true')
						const updatedFrameSideState: FrameSideType = {
							...currentFrameSide,
							isQueenConfirmed: true,
						}
						upsertFrameSide(updatedFrameSideState)
					} else {
						console.log('onFrameQueenDetected: AI found queen but already confirmed or frameSide missing, skipping confirmation update.')
					}
				})
			}
		} else {
			console.log('onFrameQueenDetected: Skipping update (no response data or liveFrameSideFile is null)') // Updated log message
		}
	}, [liveFrameSideFile, frameSideId]) // Dependency is now liveFrameSideFile

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
		handleBeesUpdate
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
		handleResourcesUpdate
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
		handleQueenCupsUpdate
	)

	useSubscription(
		gql`
			subscription onFrameQueenDetected($frameSideId: String) {
				onFrameQueenDetected(frameSideId: $frameSideId) {
					delta
					isQueenDetectionComplete
				}
			}
		`,
		{ frameSideId },
		handleQueenUpdate
	)

	const [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`
		mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
			filesStrokeEditMutation(files: $files)
		}
	`)

	const onStrokeHistoryUpdate = useCallback(async (strokeHistory) => {
		// Optimistically update via mutation first
		filesStrokeEditMutate({
			files: [
				{
					frameSideId: frameSide.id,
					fileId: file.id,
					strokeHistory,
				},
			],
		})

		// Then update Dexie
		if (liveFrameSideFile) { // Use liveFrameSideFile
			const newState = { ...liveFrameSideFile, strokeHistory } // Use liveFrameSideFile
			updateFrameSideFile(newState) // Only update Dexie
			// setFrameSideFileData(newState) // Removed state update
		}
	}, [filesStrokeEditMutate, frameSide.id, file.id, liveFrameSideFile]) // Dependency is now liveFrameSideFile

	// Check if liveFrameSideFile is still loading (undefined means initial load)
	if (liveFrameSideFile === undefined || !frameId || !frameSideId || !frameSide) {
		return <Loading />
	}

	// Handle case where frameSideFile doesn't exist for this frameSideId
	if (liveFrameSideFile === null) {
		// Optionally render a message or specific UI
		return <div>No frame side data found.</div>;
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<ErrorMessage error={errorStrokes} />
				<DrawingCanvas
					imageUrl={file.url}
					resizes={file.resizes}
					detectedQueenCups={liveFrameSideFile.detectedQueenCups} // Use live data
					detectedBees={liveFrameSideFile.detectedBees} // Use live data
					detectedCells={liveFrameSideFile.detectedCells} // Use live data
					detectedVarroa={liveFrameSideFile.detectedVarroa} // Use live data
					strokeHistory={liveFrameSideFile.strokeHistory} // Use live data
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
					frameSideFile={liveFrameSideFile} // Pass live data
					// Removed frameSide prop passing
				/>
			</div>
		</div>
	)
}
