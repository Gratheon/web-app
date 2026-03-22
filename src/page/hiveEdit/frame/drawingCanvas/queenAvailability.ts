import type { QueenAnnotation } from '@/models/frameSideFile'

type FamilyLike = {
	id?: number
	lastSeenFrameId?: number
	lastSeenFrameSideId?: number
}

type BuildOccupiedFamilyIdsParams = {
	queenAnnotations: QueenAnnotation[]
	families: FamilyLike[]
	currentFrameId?: number
	currentFrameSideId?: number
}

export function buildOccupiedFamilyIds({
	queenAnnotations,
	families,
	currentFrameId,
	currentFrameSideId,
}: BuildOccupiedFamilyIdsParams): Set<number> {
	const occupied = new Set<number>()

	for (const annotation of queenAnnotations || []) {
		const familyId = Number(annotation?.familyId)
		if (Number.isFinite(familyId) && familyId > 0) {
			occupied.add(familyId)
		}
	}

	for (const family of families || []) {
		const familyId = Number(family?.id)
		if (!Number.isFinite(familyId) || familyId <= 0) continue

		const lastSeenFrameSideId = Number(family?.lastSeenFrameSideId)
		if (Number.isFinite(lastSeenFrameSideId) && lastSeenFrameSideId > 0) {
			if (!Number.isFinite(currentFrameSideId) || currentFrameSideId <= 0 || lastSeenFrameSideId !== currentFrameSideId) {
				occupied.add(familyId)
			}
			continue
		}

		// Fallback for stale/incomplete data where only frame-level location is known.
		const lastSeenFrameId = Number(family?.lastSeenFrameId)
		if (Number.isFinite(lastSeenFrameId) && lastSeenFrameId > 0) {
			if (!Number.isFinite(currentFrameId) || currentFrameId <= 0 || lastSeenFrameId !== currentFrameId) {
				occupied.add(familyId)
			}
		}
	}

	return occupied
}
