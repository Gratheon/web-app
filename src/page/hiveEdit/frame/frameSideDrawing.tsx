import React, { useCallback } from 'react' // Removed useSubscription
import { useLiveQuery } from 'dexie-react-hooks'
import { gql, useMutation } from '@/api' // Removed useSubscription
// Import only needed model functions and types
import {
	FrameSideFile, QueenAnnotation, getFrameSideFile, removeNearestDetectedQueen, updateDetectedCellsData, updateQueenAnnotationsData, updateStrokeHistoryData
} from '@/models/frameSideFile' // Removed append...Data functions
import {
	getFrameSideCells,
	newFrameSideCells,
	updateFrameSideCells
} from '@/models/frameSideCells'
import { getAllFamiliesByHive, updateFamily, updateFamilyLastSeen } from '@/models/family'
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
	hiveId: string | number
	boxId?: string | number
	allowDrawing?: boolean
	saveRequestId?: number
	onCellEditsStateChange?: (state: { hasUnsaved: boolean; isSaving: boolean }) => void
}

export default function FrameSideDrawing({
	file,
	frameSide,
	// Removed initialFrameSideFile prop as we fetch live data
	frameId,
	frameSideId,
	hiveId,
	boxId,
	allowDrawing = true,
	saveRequestId = 0,
	onCellEditsStateChange = () => {},
}: FrameSideDrawingProps) {
	// Model function getFrameSideFile now handles invalid IDs
	const liveFrameSideFile = useLiveQuery(
		() => getFrameSideFile({ frameSideId: +frameSideId }),
		[frameSideId]
	);
	const liveFrameSideCells = useLiveQuery(
		() => getFrameSideCells(+frameSideId),
		[frameSideId]
	);
	const hiveFamilies = useLiveQuery(
		() => getAllFamiliesByHive(+hiveId),
		[hiveId],
		[]
	);

	// Call the custom hook to handle subscriptions
	useFrameSideSubscriptions(frameSideId);

	// Keep only the mutation and the stroke history update logic

	const [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`
		mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
			filesStrokeEditMutation(files: $files)
		}
	`)
	const [frameSideCellsMutate] = useMutation(gql`
		mutation updateFrameSideCells($cells: FrameSideCellsInput!) {
			updateFrameSideCells(cells: $cells)
		}
	`)
	const [addQueenToHiveMutate] = useMutation(gql`
		mutation addQueenToHive($hiveId: ID!, $queen: FamilyInput!) {
			addQueenToHive(hiveId: $hiveId, queen: $queen) {
				id
				name
				race
				added
				color
			}
		}
	`)

	const getRelativeCounts = useCallback((cells: any[]) => {
		let brood = 0
		let droneBrood = 0
		let cappedBrood = 0
		let eggs = 0
		let pollen = 0
		let honey = 0
		let nectar = 0
		let empty = 0

		for (const cell of cells || []) {
			const cls = Array.isArray(cell) ? cell[0] : undefined
			switch (cls) {
				case 0: cappedBrood += 1; break
				case 1: eggs += 1; break
				case 2: honey += 1; break
				case 3: brood += 1; break
				case 4: nectar += 1; break
				case 5: empty += 1; break
				case 6: pollen += 1; break
				case 7: droneBrood += 1; break
			}
		}

		const total = brood + droneBrood + cappedBrood + eggs + pollen + honey + nectar + empty
		if (total <= 0) {
			return {
				broodPercent: 0,
				droneBroodPercent: 0,
				cappedBroodPercent: 0,
				eggsPercent: 0,
				nectarPercent: 0,
				pollenPercent: 0,
				honeyPercent: 0,
			}
		}

		return {
			broodPercent: Math.floor((100 * brood) / total),
			droneBroodPercent: Math.floor((100 * droneBrood) / total),
			cappedBroodPercent: Math.floor((100 * cappedBrood) / total),
			eggsPercent: Math.floor((100 * eggs) / total),
			nectarPercent: Math.floor((100 * nectar) / total),
			pollenPercent: Math.floor((100 * pollen) / total),
			honeyPercent: Math.floor((100 * honey) / total),
		}
	}, [])

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

	const onDetectedCellsUpdate = useCallback(async (detectedCells) => {
		const numericFrameSideId = +frameSideId
		await updateDetectedCellsData(numericFrameSideId, detectedCells || [])

		const relativeCounts = getRelativeCounts(detectedCells || [])
		const frameSideCellsState =
			(await getFrameSideCells(numericFrameSideId)) ||
			newFrameSideCells(numericFrameSideId, undefined)

		frameSideCellsState.broodPercent = relativeCounts.broodPercent
		frameSideCellsState.droneBroodPercent = relativeCounts.droneBroodPercent
		frameSideCellsState.cappedBroodPercent = relativeCounts.cappedBroodPercent
		frameSideCellsState.eggsPercent = relativeCounts.eggsPercent
		frameSideCellsState.nectarPercent = relativeCounts.nectarPercent
		frameSideCellsState.pollenPercent = relativeCounts.pollenPercent
		frameSideCellsState.honeyPercent = relativeCounts.honeyPercent
		frameSideCellsState.cells = detectedCells || []

		await updateFrameSideCells(frameSideCellsState)

		await frameSideCellsMutate({
			cells: {
				id: frameSideCellsState.id,
				broodPercent: frameSideCellsState.broodPercent,
				droneBroodPercent: frameSideCellsState.droneBroodPercent,
				cappedBroodPercent: frameSideCellsState.cappedBroodPercent,
				eggsPercent: frameSideCellsState.eggsPercent,
				nectarPercent: frameSideCellsState.nectarPercent,
				pollenPercent: frameSideCellsState.pollenPercent,
				honeyPercent: frameSideCellsState.honeyPercent,
				cells: detectedCells || [],
			},
		})
	}, [frameSideId, frameSideCellsMutate, getRelativeCounts])

	const onQueenAnnotationsUpdate = useCallback(async (queenAnnotations: QueenAnnotation[]) => {
		const numericFrameSideId = +frameSideId
		const numericFrameId = +frameId
		const numericBoxId = boxId ? +boxId : undefined
		const normalized = Array.isArray(queenAnnotations) ? queenAnnotations : []
		await updateQueenAnnotationsData(numericFrameSideId, normalized)

		const approvedWithFamily = normalized.filter(
			(annotation) => annotation.status === 'approved' && annotation.familyId
		)
		for (const annotation of approvedWithFamily) {
			await updateFamilyLastSeen(Number(annotation.familyId), {
				frameId: numericFrameId,
				frameSideId: numericFrameSideId,
				boxId: Number.isFinite(numericBoxId) ? numericBoxId : undefined,
				seenAt: annotation.updatedAt || new Date().toISOString(),
			})
		}
	}, [frameSideId, frameId, boxId])

	const onCreateQueen = useCallback(async (queen: { name?: string; race?: string; added?: string; color?: string | null }) => {
		const result = await addQueenToHiveMutate({
			hiveId: String(hiveId),
			queen: {
				name: queen.name,
				race: queen.race,
				added: queen.added,
				color: queen.color,
			},
		})
		const createdQueen = result?.data?.addQueenToHive
		if (!createdQueen?.id) {
			return null
		}
		await updateFamily({
			id: +createdQueen.id,
			hiveId: +hiveId,
			name: createdQueen.name || '',
			race: createdQueen.race || '',
			added: createdQueen.added || '',
			color: createdQueen.color || null,
		})
		return +createdQueen.id
	}, [addQueenToHiveMutate, hiveId])

	if (liveFrameSideFile === undefined || !frameId || !frameSideId || !frameSide) {
		return <Loading />
	}

	if (liveFrameSideFile === null) {
		return <div>No frame side data found.</div>;
	}

	const effectiveDetectedCells =
		Array.isArray(liveFrameSideFile?.detectedCells) && liveFrameSideFile.detectedCells.length > 0
			? liveFrameSideFile.detectedCells
			: (liveFrameSideCells?.cells || []);
	const hasStoredQueenAnnotations =
		liveFrameSideFile &&
		Object.prototype.hasOwnProperty.call(liveFrameSideFile, 'queenAnnotations')
	const effectiveQueenAnnotations: QueenAnnotation[] = hasStoredQueenAnnotations
		? (Array.isArray(liveFrameSideFile?.queenAnnotations) ? liveFrameSideFile.queenAnnotations : [])
		: (Array.isArray(liveFrameSideFile?.detectedBees)
			? liveFrameSideFile.detectedBees
				.filter((bee) => Number(bee?.n) === 3)
				.map((bee, index) => ({
					id: `ai-${index}`,
					x: Number(bee?.x) || 0.5,
					y: Number(bee?.y) || 0.5,
					radius: Math.max(Number(bee?.w) || 0.03, Number(bee?.h) || 0.03) / 2,
					source: 'ai',
					status: 'candidate',
					familyId: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}))
			: [])

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
					detectedCells={effectiveDetectedCells}
					detectedVarroa={liveFrameSideFile.detectedVarroa}
					queenAnnotations={effectiveQueenAnnotations}
					families={hiveFamilies || []}
					strokeHistory={liveFrameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
					onDetectedCellsUpdate={onDetectedCellsUpdate}
					onQueenAnnotationsUpdate={onQueenAnnotationsUpdate}
					onRemoveDetectedQueenCandidate={(target) => removeNearestDetectedQueen(+frameSideId, target)}
					onCreateQueen={onCreateQueen}
					frameSideFile={liveFrameSideFile}
					allowDrawing={allowDrawing}
					saveRequestId={saveRequestId}
					onCellEditsStateChange={onCellEditsStateChange}
				/>
			</div>
		</div>
	)
}
