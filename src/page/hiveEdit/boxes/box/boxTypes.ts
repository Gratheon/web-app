export type BoxType = {
	box: any
	boxId: number
	frameId: number
	frameSideId: number
	apiaryId: number
	hiveId: number
	editable?: boolean
	selected?: boolean
	displayMode: string
	frameSidesData?: any[]
	onFrameImageClick?: (imageUrl: string) => void
}
