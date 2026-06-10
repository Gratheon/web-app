import colors from '@/colors.ts';
import { calculateRelPx } from './drawShared';
import type { BrushCellType } from './types';

export function getCellStyle(cls: number): { stroke: string; fill: string } {
	switch (cls) {
		case 0: return { stroke: colors.cappedBroodColor, fill: colors.cappedBroodColor };
		case 1: return { stroke: colors.eggsColor, fill: colors.eggsColor };
		case 2: return { stroke: colors.honeyColor, fill: colors.honeyColor };
		case 3: return { stroke: colors.broodColor, fill: colors.broodColor };
		case 4: return { stroke: colors.nectarColor, fill: colors.nectarColor };
		case 5: return { stroke: colors.emptyCellColor, fill: colors.emptyCellColor };
		case 6: return { stroke: colors.pollenColor, fill: colors.pollenColor };
		case 7: return { stroke: colors.droneBroodColor, fill: colors.droneBroodColor };
		default: return { stroke: 'grey', fill: 'grey' };
	}
}

export function getContrastingTextColor(background: string): string {
	const rgbMatch = background.match(/\d+/g);
	if (!rgbMatch || rgbMatch.length < 3) {
		return background === '#FFD900' || background === 'rgb(255 219 127)' ? '#111' : '#fff';
	}
	const [r, g, b] = rgbMatch.slice(0, 3).map(Number);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.6 ? '#111' : '#fff';
}

export function drawDetectedCells(
	detectedFrameCells: any[],
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	opacityFactor = 1
) {
	const relPx = calculateRelPx(canvas);
	detectedFrameCells.forEach(([cls, x, y, r, probability]) => {
		const { stroke, fill } = getCellStyle(cls);
		ctx.globalAlpha = Math.max(0, Math.min(1, (0.3 + probability / 100) * opacityFactor));
		ctx.beginPath();
		ctx.strokeStyle = stroke;
		ctx.fillStyle = fill;
		ctx.lineWidth = 2 * relPx;
		ctx.arc(x * canvas.width, y * canvas.height, r * canvas.width, 0, 2 * Math.PI);
		ctx.fill();
	});
	ctx.globalAlpha = 1;
}

export function drawBrushPreview(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	brushCursor: { x: number; y: number } | null,
	selectedCellType: BrushCellType,
	brushRadiusRatio: number
) {
	if (!brushCursor) return;

	const radius = brushRadiusRatio * canvas.height;
	if (selectedCellType === 'erase') {
		ctx.save();
		ctx.globalAlpha = 0.95;
		ctx.strokeStyle = '#ff4d4f';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(brushCursor.x * canvas.width, brushCursor.y * canvas.height, radius, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.restore();
		return;
	}

	const { stroke, fill } = getCellStyle(selectedCellType);
	ctx.save();
	ctx.globalAlpha = 0.85;
	ctx.strokeStyle = stroke;
	ctx.fillStyle = fill;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(brushCursor.x * canvas.width, brushCursor.y * canvas.height, radius, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}
