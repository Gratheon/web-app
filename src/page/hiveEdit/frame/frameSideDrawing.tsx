import React, { useCallback } from 'react' // Removed useSubscription
import { useLiveQuery } from 'dexie-react-hooks'
import { gql, useMutation, useUploadMutation } from '@/api' // Removed useSubscription
// Import only needed model functions and types
import {
	FrameSideFile, QueenAnnotation, getFrameSideFile, removeNearestDetectedQueen, updateDetectedCellsData, updateQueenAnnotationsData, updateStrokeHistoryData
} from '@/models/frameSideFile' // Removed append...Data functions
import {
	getFrameSideCells,
	newFrameSideCells,
	updateFrameSideCells
} from '@/models/frameSideCells'
import { getAllFamiliesByHive, getFamilyById, updateFamily, updateFamilyLastSeen } from '@/models/family'
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

async function loadImageElement(url: string): Promise<HTMLImageElement> {
	return await new Promise((resolve, reject) => {
		const img = new Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => resolve(img)
		img.onerror = (error) => reject(error)
		img.src = url
	})
}

async function cropQueenPreviewImage(imageUrl: string, annotation: QueenAnnotation): Promise<Blob | null> {
	const x = Number(annotation?.x)
	const y = Number(annotation?.y)
	const radiusRatio = Number(annotation?.radius)
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null

	const image = await loadImageElement(imageUrl)
	const baseRadius = Number.isFinite(radiusRatio) && radiusRatio > 0 ? radiusRatio : 0.022
	const cropSize = Math.max(120, Math.min(600, Math.round(image.width * baseRadius * 7)))

	const centerX = Math.round(x * image.width)
	const centerY = Math.round(y * image.height)
	const sx = Math.max(0, Math.min(image.width - cropSize, centerX - Math.floor(cropSize / 2)))
	const sy = Math.max(0, Math.min(image.height - cropSize, centerY - Math.floor(cropSize / 2)))

	const canvas = document.createElement('canvas')
	canvas.width = cropSize
	canvas.height = cropSize
	const ctx = canvas.getContext('2d')
	if (!ctx) return null

	ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize)

	return await new Promise((resolve) => {
		canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
	})
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
	const [uploadQueenPreviewMutate] = useUploadMutation(gql`
		mutation uploadFrameSide($file: Upload!) {
			uploadFrameSide(file: $file) {
				id
				url
			}
		}
	`) as any
	const [confirmFrameSideQueenMutate] = useMutation(gql`
		mutation confirmFrameSideQueen($frameSideId: ID!, $isConfirmed: Boolean!) {
			confirmFrameSideQueen(frameSideId: $frameSideId, isConfirmed: $isConfirmed)
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

	const uploadAndStoreQueenPreview = useCallback(async (
		familyId: number,
		annotation: QueenAnnotation,
		options?: { force?: boolean }
	) => {
		const familyFromHive = (hiveFamilies || []).find((item) => Number(item?.id) === familyId)
		const family = familyFromHive || (await getFamilyById(familyId))
		if (!options?.force && family?.previewImageUrl) {
			return
		}

		const previewBlob = await cropQueenPreviewImage(file.url, annotation)
		if (!previewBlob) return

		const previewFile = new File(
			[previewBlob],
			`queen-preview-${familyId}-${Date.now()}.jpg`,
			{ type: 'image/jpeg' }
		)

		const uploadResult = await uploadQueenPreviewMutate({ file: previewFile })
		if (uploadResult?.error) {
			return
		}
		const previewImageUrl = uploadResult?.data?.uploadFrameSide?.url
		if (!previewImageUrl) return

		await updateFamily({
			...(family || {}),
			id: Number(familyId),
			hiveId: Number(hiveId),
			previewImageUrl,
		})
	}, [file.url, hiveFamilies, hiveId, uploadQueenPreviewMutate])

	const onQueenAnnotationsUpdate = useCallback(async (queenAnnotations: QueenAnnotation[]) => {
		const numericFrameSideId = +frameSideId
		const numericFrameId = +frameId
		const numericBoxId = boxId ? +boxId : undefined
		const normalized = Array.isArray(queenAnnotations) ? queenAnnotations : []
		await updateQueenAnnotationsData(numericFrameSideId, normalized)
		const hasApprovedQueen = normalized.some((annotation) => annotation?.status === 'approved')
		try {
			await confirmFrameSideQueenMutate({
				frameSideId: String(frameSideId),
				isConfirmed: hasApprovedQueen,
			})
		} catch (error) {
			console.error('Failed to persist confirmed queen presence:', error, {
				frameSideId,
				hasApprovedQueen,
			})
		}

		const approvedWithFamily = normalized.filter(
			(annotation) => annotation.status === 'approved' && annotation.familyId
		)
		const previousAnnotations: QueenAnnotation[] = Array.isArray(liveFrameSideFile?.queenAnnotations)
			? liveFrameSideFile.queenAnnotations
			: []
		const previousById = new Map<string, QueenAnnotation>()
		for (const annotation of previousAnnotations) {
			if (!annotation?.id) continue
			previousById.set(annotation.id, annotation)
		}
		const forcePreviewFamilyIds = new Set<number>()
		for (const annotation of approvedWithFamily) {
			const annotationId = String(annotation?.id || '')
			const previous = previousById.get(annotationId)
			if (!previous) continue
			const prevX = Number(previous?.x)
			const prevY = Number(previous?.y)
			const prevRadius = Number(previous?.radius)
			const nextX = Number(annotation?.x)
			const nextY = Number(annotation?.y)
			const nextRadius = Number(annotation?.radius)
			const hasGeometryChange =
				Math.abs(nextX - prevX) > 0.000001 ||
				Math.abs(nextY - prevY) > 0.000001 ||
				Math.abs(nextRadius - prevRadius) > 0.000001
			if (!hasGeometryChange) continue
			const familyId = Number(annotation.familyId)
			if (Number.isFinite(familyId) && familyId > 0) {
				forcePreviewFamilyIds.add(familyId)
			}
		}
		const previewCandidateByFamily = new Map<number, QueenAnnotation>()
		for (const annotation of approvedWithFamily) {
			const familyId = Number(annotation.familyId)
			await updateFamilyLastSeen(familyId, {
				frameId: numericFrameId,
				frameSideId: numericFrameSideId,
				boxId: Number.isFinite(numericBoxId) ? numericBoxId : undefined,
				seenAt: annotation.updatedAt || new Date().toISOString(),
			})
			const current = previewCandidateByFamily.get(familyId)
			if (!current) {
				previewCandidateByFamily.set(familyId, annotation)
				continue
			}
			const currentUpdatedAt = Date.parse(String(current.updatedAt || ''))
			const nextUpdatedAt = Date.parse(String(annotation.updatedAt || ''))
			if (!Number.isFinite(currentUpdatedAt) || nextUpdatedAt > currentUpdatedAt) {
				previewCandidateByFamily.set(familyId, annotation)
			}
		}

		for (const [familyId, annotation] of previewCandidateByFamily.entries()) {
			try {
				await uploadAndStoreQueenPreview(familyId, annotation, {
					force: forcePreviewFamilyIds.has(familyId),
				})
			} catch (error) {
				console.error('Failed to upload/store queen preview image:', error, { familyId, annotation })
			}
		}
	}, [boxId, confirmFrameSideQueenMutate, frameId, frameSideId, liveFrameSideFile?.queenAnnotations, uploadAndStoreQueenPreview])

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
	const storedQueenAnnotations: QueenAnnotation[] = hasStoredQueenAnnotations
		? (Array.isArray(liveFrameSideFile?.queenAnnotations) ? liveFrameSideFile.queenAnnotations : [])
		: []
	const aiQueenCandidates: QueenAnnotation[] = Array.isArray(liveFrameSideFile?.detectedBees)
		? liveFrameSideFile.detectedBees
			.filter((bee) => Number(bee?.n) === 3)
			.map((bee) => {
				const x = Number(bee?.x) || 0.5
				const y = Number(bee?.y) || 0.5
				const radius = Math.max(Number(bee?.w) || 0.03, Number(bee?.h) || 0.03) / 2
				const id = `ai-${Math.round(x * 10000)}-${Math.round(y * 10000)}`
				return {
					id,
					x,
					y,
					radius,
					source: 'ai',
					status: 'candidate',
					familyId: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}
			})
		: []
	const effectiveQueenAnnotations: QueenAnnotation[] = (() => {
		if (!hasStoredQueenAnnotations) {
			return aiQueenCandidates
		}

		const next = [...storedQueenAnnotations]
		const proximity = 0.03
		for (const aiCandidate of aiQueenCandidates) {
			const duplicate = next.some((annotation) => {
				const dx = Number(annotation?.x || 0) - aiCandidate.x
				const dy = Number(annotation?.y || 0) - aiCandidate.y
				return Math.sqrt((dx * dx) + (dy * dy)) <= proximity
			})
			if (!duplicate) {
				next.push(aiCandidate)
			}
		}

		return next
	})()

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
					currentFrameId={+frameId}
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
