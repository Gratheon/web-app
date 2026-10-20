export const FRAME_DRAG_PAYLOAD_MIME = 'application/gratheon-frame-dnd'
export const MAX_HIVE_BOX_WIDTH_FRAMES = 25

export const BOX_SLOT_CAPACITY: Record<string, number> = {
	DEEP: 10,
	SUPER: 10,
	LARGE_HORIZONTAL_SECTION: 33,
}

// Hard cap on frames per box, mirrored in swarm-api (graph/frame_limit.go).
// Long Langstroth hives hold 30-33 frames, Lazutin ~25, Layens ~20 (up to 30),
// so 33 covers every common horizontal design.
export const MAX_FRAMES_PER_BOX: Record<string, number> = {
	LARGE_HORIZONTAL_SECTION: 33,
}

export function getSlotCapacity(
	boxType: string,
	boxFrames: any[] = [],
	fallback = 10
): number {
	const base = BOX_SLOT_CAPACITY[boxType] || fallback
	const maxPosition = boxFrames.reduce(
		(max, frame) => Math.max(max, +(frame?.position || 0)),
		0
	)
	return Math.max(base, maxPosition)
}
