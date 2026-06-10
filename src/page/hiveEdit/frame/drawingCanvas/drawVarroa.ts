import { calculateRelPx } from './drawShared';

export function drawDetectedVarroa(
	detectedVarroa: any[],
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement
) {
	const relPx = calculateRelPx(canvas);
	detectedVarroa.forEach(({ c, x, y, w }) => {
		ctx.globalAlpha = 0.5 + c / 100;
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		ctx.lineWidth = 8 * relPx;

		const radius = (w / 2) * canvas.width;
		ctx.lineWidth = 4 * relPx;
		ctx.arc(x * canvas.width, y * canvas.height, radius, 0, 2 * Math.PI);
		ctx.stroke();
	});
	ctx.globalAlpha = 1;
}

export function drawQueenCups(
	queenCups: any[],
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement
) {
	const relPx = calculateRelPx(canvas);
	queenCups.forEach(({ x, y, x2, y2 }) => {
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		ctx.lineWidth = 6 * relPx;
		ctx.roundRect(
			x * canvas.width,
			y * canvas.height,
			(x2 - x) * canvas.width,
			// WHY: existing payloads were tuned against width-based scaling here.
			// Keep the original axis choice to avoid changing previously reviewed overlays.
			(y2 - y) * canvas.width,
			10 * relPx
		);
		ctx.stroke();
	});
	ctx.globalAlpha = 1;
}
