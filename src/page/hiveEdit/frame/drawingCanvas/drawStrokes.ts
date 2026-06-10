import type { DrawingLine, DrawingPoint } from './types';

export function drawStrokeSegment(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	stroke: DrawingPoint[]
) {
	ctx.strokeStyle = 'white';
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	const l = stroke.length - 1;

	if (stroke.length >= 3) {
		const xc = (canvas.width * (stroke[l].x + stroke[l - 1].x)) / 2;
		const yc = (canvas.height * (stroke[l].y + stroke[l - 1].y)) / 2;
		ctx.lineWidth = stroke[l - 1].lineWidth * canvas.width;
		ctx.quadraticCurveTo(canvas.width * stroke[l - 1].x, canvas.height * stroke[l - 1].y, xc, yc);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(xc, yc);
	} else if (stroke.length > 0) {
		const point = stroke[l];
		ctx.lineWidth = point.lineWidth * canvas.width;
		ctx.strokeStyle = point.color || 'white';
		ctx.beginPath();
		ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
		ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
		ctx.stroke();
	}
}

export function redrawStrokes(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	strokeHistory: DrawingLine[]
) {
	strokeHistory.forEach((stroke) => {
		if (stroke && stroke.length > 0) {
			ctx.beginPath();
			const currentPath: DrawingPoint[] = [];
			stroke.forEach((point) => {
				currentPath.push(point);
				drawStrokeSegment(canvas, ctx, currentPath);
			});
		}
	});
}
