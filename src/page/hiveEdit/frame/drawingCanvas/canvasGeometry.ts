import { dpr } from './constants';

export type CanvasCameraState = {
	zoom: number;
	offset: { x: number; y: number };
};

export function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

export function getCanvasRelativePosition(
	canvas: HTMLCanvasElement,
	e: MouseEvent | TouchEvent
): { x: number; y: number } {
	const rect = canvas.getBoundingClientRect();
	let clientX: number;
	let clientY: number;

	if (e instanceof MouseEvent) {
		clientX = e.clientX;
		clientY = e.clientY;
	} else if (e.touches && e.touches[0]) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	} else {
		return { x: 0, y: 0 };
	}

	const x = clientX - rect.left;
	const y = clientY - rect.top;
	return {
		x: x * (canvas.width / rect.width),
		y: y * (canvas.height / rect.height),
	};
}

export function getNormalizedPosition(
	canvas: HTMLCanvasElement,
	pos: { x: number; y: number },
	camera: CanvasCameraState
): { x: number; y: number } {
	return {
		// WHY: pointer events arrive in screen space while cell/queen data is stored in image space.
		// Undo the active pan+zoom transform before normalizing so edits stay anchored to the image.
		x: (pos.x - camera.offset.x) / (camera.zoom * canvas.width),
		y: (pos.y - camera.offset.y) / (camera.zoom * canvas.height),
	};
}

export function clampCameraOffset(canvas: HTMLCanvasElement, camera: CanvasCameraState) {
	const minX = canvas.width - canvas.width * camera.zoom;
	const minY = canvas.height - canvas.height * camera.zoom;
	camera.offset.x = Math.min(0, Math.max(minX, camera.offset.x));
	camera.offset.y = Math.min(0, Math.max(minY, camera.offset.y));
}

export function getPressure(e: MouseEvent | TouchEvent): number {
	if (
		e instanceof TouchEvent &&
		e.touches &&
		e.touches[0] &&
		typeof e.touches[0].force !== 'undefined' &&
		e.touches[0].force > 0
	) {
		return e.touches[0].force;
	}
	return 0.5;
}

export function debounce<T extends (...args: any[]) => void>(func: T, timeout = 300) {
	let timer: number | undefined;
	return (...args: Parameters<T>) => {
		if (timer !== undefined) {
			window.clearTimeout(timer);
		}
		timer = window.setTimeout(() => {
			func(...args);
		}, timeout);
	};
}

export function calculateCanvasSize(
	canvas: HTMLCanvasElement,
	imgWidth: number,
	imgHeight: number,
	devicePixelRatio = dpr
) {
	const parentContainer = canvas.parentElement;
	const containerWidth = parentContainer
		? parentContainer.clientWidth
		: document.documentElement.clientWidth;
	const isMobileView = document.body.clientWidth < 1200;
	const zoomEnabled = !isMobileView;

	// WHY: size against the parent container instead of the already-scaled canvas box.
	// Measuring the canvas itself causes feedback loops where the backing store size affects layout.
	const cssWidth = Math.max(Math.floor(containerWidth), 1);
	const cssHeight = Math.max(Math.floor(cssWidth * (imgHeight / imgWidth)), 1);

	canvas.width = Math.floor(cssWidth * devicePixelRatio);
	canvas.height = Math.floor(cssHeight * devicePixelRatio);
	canvas.style.width = '100%';
	canvas.style.height = `${cssHeight}px`;

	return {
		zoomEnabled,
		cssWidth,
		cssHeight,
	};
}

export function initCanvasSize(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | null,
	devicePixelRatio = dpr
) {
	const width = image ? image.width : 1024;
	const height = image ? image.height : 768;
	const result = calculateCanvasSize(canvas, width, height, devicePixelRatio);
	ctx.imageSmoothingEnabled = true;
	return result;
}
