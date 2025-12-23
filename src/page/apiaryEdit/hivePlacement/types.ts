export const HIVE_SIZE = 37.5
export const CANVAS_HEIGHT = 600

export interface HivePlacement {
	hiveId: string
	x: number
	y: number
	rotation: number
}

export interface Obstacle {
	id: string
	type: 'CIRCLE' | 'RECTANGLE'
	x: number
	y: number
	width?: number
	height?: number
	radius?: number
	rotation: number
	label?: string
	objectHeight?: number
}

export interface Hive {
	id: string
	hiveNumber?: number
	boxCount?: number
	collapse_date?: string
}

export interface DragState {
	isDragging: boolean
	isDraggingRotation: boolean
	isDraggingObstacle: boolean
	isDraggingObstacleRotation: boolean
	isResizingObstacle: boolean
}

