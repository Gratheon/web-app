import type { QueenAnnotation } from '@/models/frameSideFile';
import { DEFAULT_BRUSH_DIAMETER_RATIO } from './constants';
import { drawDetectedBees } from './drawBees';
import { drawBrushPreview, drawDetectedCells } from './drawCells';
import { drawQueenAnnotations, drawQueenPlacementPreview } from './drawQueens';
import { redrawStrokes } from './drawStrokes';
import { drawQueenCups, drawDetectedVarroa } from './drawVarroa';
import type { BrushCellType, CanvasCursorPoint, DrawingLine } from './types';

export interface DrawLayersParams {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	image: HTMLImageElement | null;
	strokeHistory: DrawingLine[];
	showDetectedCells?: boolean;
	showBees: boolean;
	showDrones: boolean;
	isAiQueenVisible: boolean;
	detectedBees: any[];
	detectedCells: any[];
	cellsOpacityFactor?: number;
	showQueenCups: boolean;
	detectedQueenCups: any[];
	showVarroa: boolean;
	detectedVarroa: any[];
	showQueenAnnotations?: boolean;
	queenAnnotations?: QueenAnnotation[];
	familyNameById?: Record<number, string>;
	brushCursor?: CanvasCursorPoint | null;
	isAddingQueenMarker?: boolean;
	canCellBrushPreview?: boolean;
	activeTool?: 'cell-brush' | 'stroke';
	selectedCellType?: BrushCellType;
	brushRadiusRatio?: number;
}

export function drawCanvasLayers({
	canvas,
	ctx,
	image,
	strokeHistory,
	showDetectedCells = true,
	showBees,
	showDrones,
	isAiQueenVisible,
	detectedBees,
	detectedCells,
	showQueenCups,
	detectedQueenCups,
	showVarroa,
	detectedVarroa,
	showQueenAnnotations = true,
	queenAnnotations = [],
	familyNameById = {},
	brushCursor,
	isAddingQueenMarker = false,
	canCellBrushPreview = false,
	activeTool,
	selectedCellType,
	brushRadiusRatio = DEFAULT_BRUSH_DIAMETER_RATIO / 2,
	cellsOpacityFactor = 1,
}: DrawLayersParams) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	if (image) {
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	}
	if (showDetectedCells && detectedCells) drawDetectedCells(detectedCells, ctx, canvas, cellsOpacityFactor);
	if (showVarroa && detectedVarroa) drawDetectedVarroa(detectedVarroa, ctx, canvas);
	if ((showBees || showDrones || isAiQueenVisible) && detectedBees) {
		drawDetectedBees(detectedBees, ctx, canvas, showBees, showDrones, isAiQueenVisible);
	}
	if (showQueenAnnotations && queenAnnotations) {
		drawQueenAnnotations(queenAnnotations, ctx, canvas, familyNameById);
	}
	if (showQueenCups && detectedQueenCups) drawQueenCups(detectedQueenCups, ctx, canvas);
	if (strokeHistory && strokeHistory.length > 0) redrawStrokes(canvas, ctx, strokeHistory);
	if (isAddingQueenMarker && brushCursor) {
		drawQueenPlacementPreview(ctx, canvas, brushCursor);
	} else if (canCellBrushPreview && activeTool === 'cell-brush' && selectedCellType !== undefined && brushCursor) {
		drawBrushPreview(ctx, canvas, brushCursor, selectedCellType, brushRadiusRatio);
	}
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const tempImg = new Image();
		tempImg.src = url;
		tempImg.onload = () => resolve(tempImg);
		tempImg.onerror = (e) => reject(e);
	});
}
