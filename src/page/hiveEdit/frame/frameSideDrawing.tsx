import React, { useCallback } from 'react' // Removed useSubscription
import { useLiveQuery } from 'dexie-react-hooks'
import { gql, useMutation } from '@/api' // Removed useSubscription
// Import only needed model functions and types
import {
	FrameSideFile, getFrameSideFile, updateStrokeHistoryData
} from '@/models/frameSideFile' // Removed append...Data functions
import { FrameSide as FrameSideType } from '@/models/frameSide' // Removed getFrameSide, upsertFrameSide
import Loading from '@/shared/loader'
import ErrorMessage from '@/shared/messageError'
import DrawingCanvas from '@/page/hiveEdit/frame/drawingCanvas'
import styles from '@/page/hiveEdit/frame/styles.module.less'
import { useFrameSideSubscriptions } from '@/hooks/useFrameSideSubscriptions' // Import the new hook
// Define local type for the file prop (keep this)
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

	// Call the custom hook to handle subscriptions
	useFrameSideSubscriptions(frameSideId);

	// Keep only the mutation and the stroke history update logic

	const [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`
		mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
			filesStrokeEditMutation(files: $files)
		}
	`)

	// Updated onStrokeHistoryUpdate to use atomic modify function
	const onStrokeHistoryUpdate = useCallback(async (strokeHistory) => {
		// Optimistically update via mutation first
		filesStrokeEditMutate({
			files: [
				{
					frameSideId: frameSide.id, // Assuming frameSide.id is correct
					fileId: file.id,
					strokeHistory,
				},
			],
		});

		// Then update Dexie atomically
		updateStrokeHistoryData(+frameSideId, strokeHistory)
			.catch(error => {
				console.error("Failed to update stroke history:", error);
			});

	}, [filesStrokeEditMutate, frameSide.id, file.id, frameSideId]); // Added frameSideId dependency

	// Check if liveFrameSideFile is still loading (undefined means initial load)
	if (liveFrameSideFile === undefined || !frameId || !frameSideId || !frameSide) {
		return <Loading />
	}

	// Handle case where frameSideFile doesn't exist for this frameSideId
	if (liveFrameSideFile === null) {
		// Optionally render a message or specific UI
		return <div>No frame side data found.</div>;
	}

	// Log the bee count being passed to DrawingCanvas
	console.log(`Rendering FrameSideDrawing. liveFrameSideFile.detectedBees length: ${liveFrameSideFile?.detectedBees?.length ?? 'N/A'}`);

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
