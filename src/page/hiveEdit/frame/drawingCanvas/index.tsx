import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import Button from '@/shared/button';
import colors from '@/colors.ts';
import Checkbox from '@/icons/checkbox.tsx';
import FrameCells from '@/icons/frameCells.tsx';
import T from '@/shared/translate';
import Loader from '@/shared/loader';
import styles from './styles.module.less';
import QueenIcon from '@/icons/queenIcon.tsx';
import LeftChevron from '@/icons/leftChevron.tsx';
import RightChevron from '@/icons/rightChevron.tsx';

let img: HTMLImageElement | null = null;
let isMousedown = false;
let points: { x: number; y: number; lineWidth: number; color?: string }[] = [];
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

let REL_PX = 1;
let globalCameraZoom = 1;
const MAX_ZOOM = 100;
const MIN_ZOOM = 1;
const MED_ZOOM = 2;
let zoomEnabled = false;

let offsetsum = { x: 0, y: 0 };
let isPanning = false;
let startPanPosition = { x: 0, y: 0 };
let initialPanOffset = { x: 0, y: 0 };

function calculateRelPx(canvas: HTMLCanvasElement) {
	return canvas.width / 1024;
}

function drawStrokeSegment(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, stroke: typeof points) {
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
		ctx.lineTo(point.x * canvas.width, point.y * canvas.height); // Draw a dot for single point
		ctx.stroke();
	}
}

function redrawStrokes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, strokeHistory: typeof points[]) {
	strokeHistory.forEach((stroke) => {
		if (stroke && stroke.length > 0) {
			ctx.beginPath();
			let currentPath: typeof points = [];
			stroke.forEach((point) => {
				currentPath.push(point);
				drawStrokeSegment(canvas, ctx, currentPath);
			});
		}
	});
}

function getCellStyle(cls: number): { stroke: string; fill: string } {
	switch (cls) {
		case 0: return { stroke: colors.cappedBroodColor, fill: colors.cappedBroodColor };
		case 1: return { stroke: colors.eggsColor, fill: colors.eggsColor };
		case 2: return { stroke: colors.honeyColor, fill: colors.honeyColor };
		case 3: return { stroke: colors.broodColor, fill: colors.broodColor };
		case 4: return { stroke: colors.nectarColor, fill: colors.nectarColor };
		case 5: return { stroke: colors.emptyCellColor, fill: colors.emptyCellColor };
		case 6: return { stroke: colors.pollenColor, fill: colors.pollenColor };
		default: return { stroke: 'grey', fill: 'grey' };
	}
}

function drawDetectedCells(detectedFrameCells: any[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const relPx = calculateRelPx(canvas);
	detectedFrameCells.forEach(([cls, x, y, r, probability]) => {
		const { stroke, fill } = getCellStyle(cls);
		ctx.globalAlpha = 0.3 + probability / 100;
		ctx.beginPath();
		ctx.strokeStyle = stroke;
		ctx.fillStyle = fill;
		ctx.lineWidth = 2 * relPx;
		ctx.arc(x * canvas.width, y * canvas.height, r * canvas.width, 0, 2 * Math.PI);
		ctx.fill();
	});
	ctx.globalAlpha = 1;
}

function drawDetectedVarroa(detectedVarroa: any[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const relPx = calculateRelPx(canvas);
	detectedVarroa.forEach(({ c, x, y, w }) => {
		ctx.globalAlpha = 0.5 + c / 100;
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		ctx.lineWidth = 8 * relPx;
		ctx.arc(x * canvas.width, y * canvas.height, w * canvas.width * 1.5, 0, 2 * Math.PI);
		ctx.stroke();
	});
	ctx.globalAlpha = 1;
}

function drawQueenCups(queenCups: any[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
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
			(y2 - y) * canvas.width, // Should likely be height, assuming typo in original
			10 * relPx
		);
		ctx.stroke();
	});
	ctx.globalAlpha = 1;
}

function getBeeStyle(n: number): { style: string; text: string; lineWidthFactor: number } {
	const relPx = REL_PX; // Use global REL_PX for consistency here
	switch (n) {
		case 0: return { style: colors.beeWorker, text: 'worker', lineWidthFactor: 2 };
		case 1: return { style: colors.drone, text: 'drone', lineWidthFactor: 2 };
		case 2: return { style: colors.beeWorkerPollen, text: 'worker + pollen', lineWidthFactor: 2 };
		case 3: return { style: colors.queen, text: 'queen', lineWidthFactor: 4 };
		default: return { style: 'grey', text: 'unknown', lineWidthFactor: 2 };
	}
}

function drawDetectedBees(
	detectedBees: any[],
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	showBees: boolean,
	showDrones: boolean,
	showQueens: boolean
) {
	const relPx = calculateRelPx(canvas);
	REL_PX = relPx; // Update global REL_PX

	detectedBees.forEach((dt) => {
		const n = parseInt(dt.n, 10);
		if ((!showBees && (n === 0 || n === 2)) || (!showDrones && n === 1) || (!showQueens && n === 3)) {
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

function getCanvasRelativePosition(canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent): { x: number; y: number } {
	const rect = canvas.getBoundingClientRect();
	let clientX: number, clientY: number;

	if (e instanceof MouseEvent) {
		clientX = e.clientX;
		clientY = e.clientY;
	} else if (e.touches && e.touches[0]) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	} else {
		return { x: 0, y: 0 }; // Should not happen in event listeners
	}

	const x = clientX - rect.left;
	const y = clientY - rect.top;
	return {
		x: x * (canvas.width / rect.width),
		y: y * (canvas.height / rect.height)
	};
}

function getNormalizedPosition(canvas: HTMLCanvasElement, pos: { x: number; y: number }): { x: number; y: number } {
	return {
		x: (pos.x - offsetsum.x) / (globalCameraZoom * canvas.width),
		y: (pos.y - offsetsum.y) / (globalCameraZoom * canvas.height)
	};
}

function getPressure(e: MouseEvent | TouchEvent): number {
	if (e instanceof TouchEvent && e.touches && e.touches[0] && typeof e.touches[0]['force'] !== 'undefined' && e.touches[0]['force'] > 0) {
		return e.touches[0]['force'];
	}
	return 0.5; // Default pressure for mouse or non-force touch
}

function debounce(func: (...args: any[]) => void, timeout = 300) {
	let timer: NodeJS.Timeout;
	return (...args: any[]) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
}

function calculateCanvasSize(canvas: HTMLCanvasElement, imgWidth: number, imgHeight: number) {
	const parentContainer = canvas.parentElement;
	const canvasParentWidth = parentContainer ? parentContainer.clientWidth : 1024;
	const boxesWrap = document.getElementById('boxesWrap');
	const isMobileView = document.body.clientWidth < 1200;
	zoomEnabled = !isMobileView;

	const canvasWidth = isMobileView
		? document.body.clientWidth
		: (boxesWrap && parentContainer && !parentContainer.contains(boxesWrap))
			? Math.max(document.documentElement.clientWidth - boxesWrap.offsetWidth - 40, 0.5 * document.documentElement.clientWidth)
			: canvasParentWidth;

	const targetWidth = dpr * Math.floor(canvasWidth);
	canvas.width = targetWidth;
	canvas.height = targetWidth * (imgHeight / imgWidth);
	canvas.style.width = `${canvas.width / dpr}px`;
	canvas.style.height = `${canvas.height / dpr}px`;
}

function initCanvasSize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
	const width = img ? img.width : 1024;
	const height = img ? img.height : 768;
	calculateCanvasSize(canvas, width, height);
	ctx.imageSmoothingEnabled = true;
}

interface DrawLayersParams {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	strokeHistory: typeof points[];
	showBees: boolean;
	showDrones: boolean;
	isAiQueenVisible: boolean;
	detectedBees: any[];
	showCells: boolean;
	detectedCells: any[];
	showQueenCups: boolean;
	detectedQueenCups: any[];
	showVarroa: boolean;
	detectedVarroa: any[];
}

function drawCanvasLayers({
	canvas, ctx, strokeHistory, showBees, showDrones, isAiQueenVisible,
	detectedBees, showCells, detectedCells, showQueenCups, detectedQueenCups,
	showVarroa, detectedVarroa
}: DrawLayersParams) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	if (img) {
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	}
	if (showCells && detectedCells) drawDetectedCells(detectedCells, ctx, canvas);
	if (showVarroa && detectedVarroa) drawDetectedVarroa(detectedVarroa, ctx, canvas);
	if ((showBees || showDrones || isAiQueenVisible) && detectedBees) {
		drawDetectedBees(detectedBees, ctx, canvas, showBees, showDrones, isAiQueenVisible);
	}
	if (showQueenCups && detectedQueenCups) drawQueenCups(detectedQueenCups, ctx, canvas);
	if (strokeHistory && strokeHistory.length > 0) redrawStrokes(canvas, ctx, strokeHistory);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const tempImg = new Image();
		tempImg.src = url;
		tempImg.onload = () => resolve(tempImg);
		tempImg.onerror = (e) => reject(e);
	});
}

interface DrawingCanvasProps {
	imageUrl: string;
	resizes?: { width: number; url: string }[];
	strokeHistory: typeof points[];
	detectedQueenCups?: any[];
	detectedBees?: any[];
	detectedCells?: any[];
	detectedVarroa?: any[];
	onStrokeHistoryUpdate: (history: typeof points[]) => void;
	frameSideFile: any; // Define more specific type if possible
	frameSide: string; // Define more specific type if possible
}

export default function DrawingCanvas({
	imageUrl,
	resizes = [],
	strokeHistory = [],
	detectedQueenCups = [],
	detectedBees = [],
	detectedCells = [],
	detectedVarroa = [],
	onStrokeHistoryUpdate,
	frameSideFile,
}: DrawingCanvasProps) {

	const ref = useRef<HTMLCanvasElement>(null);
	const [showBees, setBeeVisibility] = useState(true);
	const [panelVisible, setPanelVisible] = useState(false);
	const [showDrones, setDroneVisibility] = useState(true);
	const [showCells, setCellVisibility] = useState(true);
	const [showQueenCups, setQueenCupsVisibility] = useState(true);
	const [showVarroa, setShowVarroaVisibility] = useState(false);
	const [version, setVersion] = useState(0);
	const [isAiQueenVisible, setIsAiQueenVisible] = useState(true);
	const [currentLineWidth, setCurrentLineWidth] = useState(0); // Track line width for drawing updates

	const getThumbnailUrl = useCallback(() => {
		let bestUrl = imageUrl;
		if (resizes && resizes.length > 0) {
			for (let i = 0; i < resizes.length; i++) {
				if (resizes[i].width > 128) {
					bestUrl = resizes[i].url;
					// Maybe add logic to pick closer to screen width?
				}
			}
		}
		return bestUrl;
	}, [imageUrl, resizes]);

	const [canvasUrl, setCanvasUrl] = useState(getThumbnailUrl());

	const forceRedraw = useCallback(() => setVersion(v => v + 1), []);

	const clearHistory = useCallback(() => {
		points = [];
		onStrokeHistoryUpdate([]);
		forceRedraw();
	}, [onStrokeHistoryUpdate, forceRedraw]);

	const undoDraw = useCallback(() => {
		const newHistory = [...strokeHistory];
		newHistory.pop();
		onStrokeHistoryUpdate(newHistory);
		forceRedraw();
	}, [strokeHistory, onStrokeHistoryUpdate, forceRedraw]);

	const redrawCurrentCanvas = useCallback(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		drawCanvasLayers({
			canvas, ctx, strokeHistory, showBees, showDrones, isAiQueenVisible,
			detectedBees, showCells, detectedCells, showQueenCups, detectedQueenCups,
			showVarroa, detectedVarroa
		});
	}, [strokeHistory, showBees, showDrones, isAiQueenVisible, detectedBees, showCells, detectedCells, showQueenCups, detectedQueenCups, showVarroa, detectedVarroa]);


	// Setup Canvas and Image
	useLayoutEffect(() => {
		let isActive = true;
		loadImage(canvasUrl).then(loadedImg => {
			if (isActive) {
				img = loadedImg;
				const canvas = ref.current;
				if (canvas) {
					const ctx = canvas.getContext('2d');
					if (ctx) {
						initCanvasSize(canvas, ctx);
						redrawCurrentCanvas();
					}
				}
			}
		}).catch(console.error);
		return () => { isActive = false; };
	}, [canvasUrl, redrawCurrentCanvas]); // Redraw when image URL changes

	// Resize Handler
	useLayoutEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const handleResize = debounce(() => {
			initCanvasSize(canvas, ctx);
			redrawCurrentCanvas();
		}, 500);

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [redrawCurrentCanvas]); // Re-attach resize listener if redraw logic changes

	// Drawing Event Handlers
	useLayoutEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const handleDrawStart = (e: MouseEvent | TouchEvent) => {
			if (isPanning || (e instanceof MouseEvent && e.button !== 0)) return;
			e.preventDefault(); // Prevent scrolling on touch

			isMousedown = true;
			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos);
			const pressure = getPressure(e);
			const newLineWidth = (Math.log(pressure + 1) * 10) / canvas.width; // Base width

			points = [{ ...normalizedPos, lineWidth: newLineWidth }];
			setCurrentLineWidth(newLineWidth); // Update state for potential use

			ctx.save();
			ctx.setTransform(globalCameraZoom, 0, 0, globalCameraZoom, offsetsum.x, offsetsum.y);
			drawStrokeSegment(canvas, ctx, points);
			ctx.restore();
		};

		const handleDrawMove = (e: MouseEvent | TouchEvent) => {
			if (!isMousedown || isPanning) return;
			e.preventDefault();

			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos);
			const pressure = getPressure(e);

			// Smoothed line width calculation
			const targetWidth = (Math.log(pressure + 1) * 40) / canvas.width;
			const newLineWidth = targetWidth * 0.2 + currentLineWidth * 0.8;

			points.push({ ...normalizedPos, lineWidth: newLineWidth });
			setCurrentLineWidth(newLineWidth);

			ctx.save();
			ctx.setTransform(globalCameraZoom, 0, 0, globalCameraZoom, offsetsum.x, offsetsum.y);
			drawStrokeSegment(canvas, ctx, points);
			ctx.restore();
		};

		const handleDrawEnd = (e: MouseEvent | TouchEvent) => {
			if (!isMousedown || isPanning || (e instanceof MouseEvent && e.button !== 0)) return;

			isMousedown = false;
			// No need to draw again here, just finalize the stroke
			if (points.length > 0) {
				const newHistory = [...strokeHistory, [...points]];
				onStrokeHistoryUpdate(newHistory);
				points = [];
			}
			setCurrentLineWidth(0);
		};

		canvas.addEventListener('mousedown', handleDrawStart);
		canvas.addEventListener('touchstart', handleDrawStart, { passive: false });
		canvas.addEventListener('mousemove', handleDrawMove);
		canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
		canvas.addEventListener('mouseup', handleDrawEnd);
		canvas.addEventListener('mouseleave', handleDrawEnd); // End draw if mouse leaves canvas
		canvas.addEventListener('touchend', handleDrawEnd);
		canvas.addEventListener('touchcancel', handleDrawEnd);

		return () => {
			canvas.removeEventListener('mousedown', handleDrawStart);
			canvas.removeEventListener('touchstart', handleDrawStart);
			canvas.removeEventListener('mousemove', handleDrawMove);
			canvas.removeEventListener('touchmove', handleDrawMove);
			canvas.removeEventListener('mouseup', handleDrawEnd);
			canvas.removeEventListener('mouseleave', handleDrawEnd);
			canvas.removeEventListener('touchend', handleDrawEnd);
			canvas.removeEventListener('touchcancel', handleDrawEnd);
		};
	}, [strokeHistory, onStrokeHistoryUpdate, currentLineWidth]); // Dependencies for drawing logic

	// Zoom and Pan Event Handlers
	useLayoutEffect(() => {
		const canvas = ref.current;
		if (!canvas || !zoomEnabled) return; // Only attach if zoom is enabled
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const handleScroll = (event: WheelEvent) => {
			if (isMousedown) return;
			event.preventDefault();

			const mousePos = getCanvasRelativePosition(canvas, event);
			const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, globalCameraZoom * zoomFactor));

			if (newZoom === globalCameraZoom) return; // No change

			if (newZoom > MED_ZOOM && canvasUrl !== imageUrl) {
				setCanvasUrl(imageUrl); // Switch to high-res
			} else if (newZoom <= MED_ZOOM && canvasUrl === imageUrl) {
				// Optional: Switch back to thumbnail if zooming out significantly?
				// setCanvasUrl(getThumbnailUrl());
			}

			const mouseXInWorldBeforeZoom = (mousePos.x - offsetsum.x) / globalCameraZoom;
			const mouseYInWorldBeforeZoom = (mousePos.y - offsetsum.y) / globalCameraZoom;

			globalCameraZoom = newZoom;

			offsetsum.x = mousePos.x - mouseXInWorldBeforeZoom * globalCameraZoom;
			offsetsum.y = mousePos.y - mouseYInWorldBeforeZoom * globalCameraZoom;

			ctx.setTransform(globalCameraZoom, 0, 0, globalCameraZoom, offsetsum.x, offsetsum.y);
			redrawCurrentCanvas();
		};

		const handlePanStart = (e: MouseEvent | TouchEvent) => {
			const isRightClick = e instanceof MouseEvent && e.button === 2;
			const isTwoFingerTouch = e instanceof TouchEvent && e.touches.length === 2;

			if (!isRightClick && !isTwoFingerTouch) return;

			e.preventDefault();
			isPanning = true;
			isMousedown = false; // Ensure drawing stops
			canvas.style.cursor = 'grabbing';
			initialPanOffset = { ...offsetsum };

			if (isRightClick) {
				startPanPosition = { x: e.clientX, y: e.clientY };
			} else if (isTwoFingerTouch) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				startPanPosition = {
					x: (touch1.clientX + touch2.clientX) / 2,
					y: (touch1.clientY + touch2.clientY) / 2
				};
			}
		};

		const handlePanMove = (e: MouseEvent | TouchEvent) => {
			if (!isPanning) return;
			e.preventDefault();

			let currentX: number, currentY: number;
			if (e instanceof MouseEvent) {
				currentX = e.clientX;
				currentY = e.clientY;
			} else if (e instanceof TouchEvent && e.touches.length === 2) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				currentX = (touch1.clientX + touch2.clientX) / 2;
				currentY = (touch1.clientY + touch2.clientY) / 2;
			} else {
				// If fingers lift during pan, stop panning
				handlePanEnd();
				return;
			}


			const totalDx = currentX - startPanPosition.x;
			const totalDy = currentY - startPanPosition.y;

			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;

			offsetsum.x = initialPanOffset.x + (totalDx * scaleX);
			offsetsum.y = initialPanOffset.y + (totalDy * scaleY);

			ctx.setTransform(globalCameraZoom, 0, 0, globalCameraZoom, offsetsum.x, offsetsum.y);
			redrawCurrentCanvas();
		};

		const handlePanEnd = () => {
			if (isPanning) {
				isPanning = false;
				canvas.style.cursor = 'default';
			}
		};

		const preventContextMenu = (e: Event) => e.preventDefault();

		canvas.addEventListener('wheel', handleScroll, { passive: false });
		canvas.addEventListener('contextmenu', preventContextMenu);
		canvas.addEventListener('mousedown', handlePanStart);
		canvas.addEventListener('touchstart', handlePanStart, { passive: false });
		// Use window for move/end to capture events outside canvas during drag
		window.addEventListener('mousemove', handlePanMove);
		window.addEventListener('touchmove', handlePanMove, { passive: false });
		window.addEventListener('mouseup', handlePanEnd);
		window.addEventListener('touchend', handlePanEnd);
		canvas.addEventListener('mouseleave', handlePanEnd); // Stop panning if mouse leaves canvas


		return () => {
			canvas.removeEventListener('wheel', handleScroll);
			canvas.removeEventListener('contextmenu', preventContextMenu);
			canvas.removeEventListener('mousedown', handlePanStart);
			canvas.removeEventListener('touchstart', handlePanStart);
			window.removeEventListener('mousemove', handlePanMove);
			window.removeEventListener('touchmove', handlePanMove);
			window.removeEventListener('mouseup', handlePanEnd);
			window.removeEventListener('touchend', handlePanEnd);
			canvas.removeEventListener('mouseleave', handlePanEnd);
		};
	}, [imageUrl, canvasUrl, redrawCurrentCanvas, zoomEnabled]); // Re-attach if zoomEnabled changes

	// Redraw when visibility toggles change
	useEffect(() => {
		redrawCurrentCanvas();
	}, [showBees, showDrones, isAiQueenVisible, showCells, showQueenCups, showVarroa, redrawCurrentCanvas]);

	// Redraw when detection data changes
	useEffect(() => {
		redrawCurrentCanvas();
	}, [detectedBees, detectedCells, detectedQueenCups, detectedVarroa, redrawCurrentCanvas]);


	const isAnyDetectionLoading =
		!frameSideFile?.isBeeDetectionComplete ||
		!frameSideFile?.isCellsDetectionComplete ||
		!frameSideFile?.isQueenCupsDetectionComplete ||
		!frameSideFile?.isQueenDetectionComplete; // Added queen detection check

	if (!imageUrl) {
		return <div><T>Loading image...</T></div>;
	}

	return (
		<div style={{ position: 'relative', overflow: 'hidden' }}>
			<div
				className={styles.buttonPanel}
				style={{ left: panelVisible ? 0 : -200 }}
			>
				<Button
					onClick={() => setPanelVisible(!panelVisible)}
					style={{ position: 'absolute', right: -43, top: 100, borderRadius: '0 20px 20px 0', border: '2px solid white', borderLeft: 'none' }}
				>
					{isAnyDetectionLoading ? <Loader size={0} /> : panelVisible ? <LeftChevron /> : <RightChevron />}
				</Button>

				<div className={styles.buttonGrp}>
					<Button onClick={() => setBeeVisibility(!showBees)}>
						{frameSideFile?.isBeeDetectionComplete ? <Checkbox on={showBees} /> : <Loader size={0} />}
						<span><T ctx="toggle worker bees visibility">Worker bees</T>{frameSideFile?.detectedWorkerBeeCount > 0 && ` (${frameSideFile.detectedWorkerBeeCount})`}</span>
					</Button>

					{detectedCells && (
						<Button onClick={() => setCellVisibility(!showCells)}>
							{frameSideFile?.isCellsDetectionComplete ? <Checkbox on={showCells} /> : <Loader size={0} />}
							<span><T ctx="toggle frame cells visibility">Frame cells</T>{frameSideFile?.isCellsDetectionComplete && <FrameCells />}</span>
						</Button>
					)}

					<Button onClick={() => setIsAiQueenVisible(!isAiQueenVisible)}>
						{frameSideFile?.isQueenDetectionComplete ? <Checkbox on={isAiQueenVisible} /> : <Loader size={0} />}
						<span><T ctx="toggle AI queen visibility">Queen</T></span>
						<QueenIcon size={14} color={'white'} />
					</Button>

					<Button onClick={() => setDroneVisibility(!showDrones)}>
						{frameSideFile?.isBeeDetectionComplete ? <Checkbox on={showDrones} /> : <Loader size={0} />}
						<span><T ctx="toggle drones visibility">Drones</T>{frameSideFile?.detectedDroneCount > 0 && ` (${frameSideFile.detectedDroneCount})`}</span>
					</Button>

					{detectedQueenCups && (
						<Button onClick={() => setQueenCupsVisibility(!showQueenCups)}>
							{frameSideFile?.isQueenCupsDetectionComplete ? <Checkbox on={showQueenCups} /> : <Loader size={0} />}
							<span><T ctx="toggle queen cups visibility">Queen cups</T></span>
						</Button>
					)}

					<Button onClick={() => setShowVarroaVisibility(!showVarroa)}>
						{frameSideFile?.isVarroaDetectionComplete ? <Checkbox on={showVarroa} /> : <Loader size={0} />}
						<span><T ctx="toggle varroa mites visibility">Varroa mites</T>{frameSideFile?.varroaCount > 0 && ` (${frameSideFile.varroaCount})`}</span>
					</Button>
				</div>
			</div>

			<canvas ref={ref} id="container" style={{ width: '100%', display: 'block', touchAction: 'none' }}>
				<T>Canvas not supported.</T>
			</canvas>

			<div className={styles.buttonGrp} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>
				<Button onClick={clearHistory}><T ctx="clear drawing button">Clear drawing</T></Button>
				<Button onClick={undoDraw}><T>Undo</T></Button>
			</div>
		</div>
	);
}
