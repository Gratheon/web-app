import type { FrameSideFile, QueenAnnotation } from '@/models/frameSideFile';

export type DrawingPoint = { x: number; y: number; lineWidth: number; color?: string };
export type DrawingLine = DrawingPoint[];
export type BrushCellType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'erase';
export type BrushSizePreset = 'small' | 'medium' | 'large';
export type NonEraseBrushCellType = Exclude<BrushCellType, 'erase'>;
export type CanvasControlTab = 'frame-cells' | 'free-draw' | 'queens' | 'bees' | 'varroa-mites';
export type ActiveCanvasTool = 'cell-brush' | 'stroke';
export type CanvasCursorPoint = { x: number; y: number };
export type QueenResizeHit = { annotationId: string };
export type QueenMoveHit = { annotationId: string };

export type DrawingCanvasFamily = {
	id: number;
	name?: string;
	added?: string;
	color?: string;
	lastSeenFrameId?: number;
	lastSeenFrameSideId?: number;
};

export type CanvasCellEditState = {
	hasUnsaved: boolean;
	isSaving: boolean;
};

export type ResizeLike = {
	// WHY: resize metadata comes from different sources.
	// WHAT: support both legacy `width` and GraphQL `max_dimension_px` fields.
	width?: number;
	max_dimension_px?: number;
	url: string;
};

export interface DrawingCanvasProps {
	imageUrl: string;
	resizes?: ResizeLike[];
	strokeHistory: DrawingLine[];
	detectedQueenCups?: any[];
	detectedBees?: any[];
	detectedDrones?: any[];
	detectedCells?: any[];
	detectedVarroa?: any[];
	queenAnnotations?: QueenAnnotation[];
	families?: DrawingCanvasFamily[];
	currentFrameId?: number;
	onStrokeHistoryUpdate: (history: DrawingLine[] | undefined) => void;
	onDetectedCellsUpdate?: (detectedCells: any[]) => void | Promise<void>;
	onQueenAnnotationsUpdate?: (queenAnnotations: QueenAnnotation[]) => void | Promise<void>;
	onRemoveDetectedQueenCandidate?: (target: { x: number; y: number }) => void | Promise<void>;
	onCreateQueen?: (queen: {
		name?: string;
		race?: string;
		added?: string;
		color?: string | null;
		parentId?: number | null;
	}) => Promise<number | null>;
	frameSideFile: Partial<FrameSideFile> & Record<string, any>;
	hideControls?: boolean;
	allowDrawing?: boolean;
	saveRequestId?: number;
	onCellEditsStateChange?: (state: CanvasCellEditState) => void;
}
