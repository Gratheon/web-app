export const FRAME_DRAG_PAYLOAD_MIME = 'application/gratheon-frame-dnd'

export const BOX_SLOT_CAPACITY: Record<string, number> = {
	DEEP: 10,
	SUPER: 10,
	LARGE_HORIZONTAL_SECTION: 25,
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
