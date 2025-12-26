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
	// Model function getFrameSideFile now handles invalid IDs
	const liveFrameSideFile = useLiveQuery(
		() => getFrameSideFile({ frameSideId: +frameSideId }),
		[frameSideId]
	);

	// Call the custom hook to handle subscriptions
	useFrameSideSubscriptions(frameSideId);

	// Keep only the mutation and the stroke history update logic

	const [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`
		mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
			filesStrokeEditMutation(files: $files)
		}
	`)

	// Updated onStrokeHistoryUpdate to use atomic modify function
	const onStrokeHistoryUpdate = async (strokeHistory) => {
		try {
			console.log('[FrameSideDrawing] Calling filesStrokeEditMutate with:', {
				files: [
					{
						frameSideId: frameSide.id,
						fileId: file.id,
						strokeHistory,
					},
				],
			});
			filesStrokeEditMutate({
				files: [
					{
						frameSideId: frameSide.id,
						fileId: file.id,
						strokeHistory,
					},
				],
			});
		} catch (e) {
			console.error('[FrameSideDrawing] Error calling filesStrokeEditMutate:', e);
		}

		updateStrokeHistoryData(+frameSideId, strokeHistory)
			.then(() => {
				console.log('[FrameSideDrawing] updateStrokeHistoryData succeeded for', frameSideId);
			})
			.catch(error => {
				console.error('[FrameSideDrawing] Failed to update stroke history:', error);
			});
	};

	if (liveFrameSideFile === undefined || !frameId || !frameSideId || !frameSide) {
		return <Loading />
	}

	if (liveFrameSideFile === null) {
		return <div>No frame side data found.</div>;
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<ErrorMessage error={errorStrokes} />
				<DrawingCanvas
					imageUrl={file.url}
					resizes={file.resizes}
					detectedQueenCups={liveFrameSideFile.detectedQueenCups}
					detectedBees={liveFrameSideFile.detectedBees}
					detectedDrones={liveFrameSideFile.detectedDrones}
					detectedCells={liveFrameSideFile.detectedCells}
					detectedVarroa={liveFrameSideFile.detectedVarroa}
					strokeHistory={liveFrameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
					frameSideFile={liveFrameSideFile}
				/>
			</div>
		</div>
	)
}
