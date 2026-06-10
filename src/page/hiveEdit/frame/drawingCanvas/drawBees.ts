import colors from '@/colors.ts';
import { calculateRelPx } from './drawShared';

export function getBeeStyle(n: number): { style: string; text: string; lineWidthFactor: number } {
	switch (n) {
		case 0: return { style: colors.beeWorker, text: 'worker', lineWidthFactor: 2 };
		case 1: return { style: colors.drone, text: 'drone', lineWidthFactor: 2 };
		case 2: return { style: colors.beeWorkerPollen, text: 'worker + pollen', lineWidthFactor: 2 };
		case 3: return { style: colors.queen, text: 'queen', lineWidthFactor: 4 };
		default: return { style: 'grey', text: 'unknown', lineWidthFactor: 2 };
	}
}

export function drawDetectedBees(
	detectedBees: any[],
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	showBees: boolean,
	showDrones: boolean,
	showQueens: boolean
) {
	const relPx = calculateRelPx(canvas);

	detectedBees.forEach((dt) => {
		const n = parseInt(dt.n, 10);
		if ((!showBees && (n === 0 || n === 2)) || (!showDrones && n === 1) || (!showQueens && n === 3)) {
			return;
		}
		if (n === 3) {
			return;
		}

		const { style, text, lineWidthFactor } = getBeeStyle(n);
		ctx.globalAlpha = 0.4 + dt.c;
		ctx.beginPath();
		ctx.fillStyle = style;
		ctx.strokeStyle = style;
		ctx.lineWidth = lineWidthFactor * relPx;

		ctx.roundRect(
			(dt.x - dt.w / 2) * canvas.width,
			(dt.y - dt.h / 2) * canvas.height,
			dt.w * canvas.width,
			dt.h * canvas.height,
			5 * relPx
		);
		ctx.stroke();

		ctx.font = `${Math.floor(8 * relPx)}px Arial`;
		ctx.lineWidth = 0.8 * relPx;
		ctx.fillText(
			text,
			(dt.x - dt.w / 2) * canvas.width + 5,
			(dt.y + dt.h / 2) * canvas.height - 3
		);
	});
	ctx.globalAlpha = 1;
}
