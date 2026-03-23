import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { gql, useQuery } from '@/api';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { getUser } from '@/models/user';
import Button from '@/shared/button';
import colors from '@/colors.ts';
import Checkbox from '@/icons/checkbox.tsx';
import T from '@/shared/translate';
import Loader from '@/shared/loader';
import RefreshIcon from '@/icons/RefreshIcon';
import styles from './styles.module.less';
import QueenIcon from '@/icons/queenIcon.tsx';
import CellBrushIcon from '@/icons/cellBrushIcon.tsx';
import EraserIcon from '@/icons/eraserIcon.tsx';
import FreeDrawIcon from '@/icons/freeDrawIcon.tsx';
import UndoStrokeIcon from '@/icons/undoStrokeIcon.tsx';
import BrushSizeIcon from '@/icons/brushSizeIcon.tsx';
import KeyboardHints from '@/shared/keyboardHints';
import Slider from '@/shared/slider';
import Modal from '@/shared/modal';
import { Tab, TabBar } from '@/shared/tab';
import inputStyles from '@/shared/input/styles.module.less';
import QueenColorPicker from '@/shared/queenColorPicker';
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor';
import type { QueenAnnotation } from '@/models/frameSideFile';
import { buildOccupiedFamilyIds } from './queenAvailability';

let img: HTMLImageElement | null = null;
let isMousedown = false;
type DrawingPoint = { x: number; y: number; lineWidth: number; color?: string }
type DrawingLine = DrawingPoint[]
type BrushCellType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'erase'
type BrushSizePreset = 'small' | 'medium' | 'large'
type NonEraseBrushCellType = Exclude<BrushCellType, 'erase'>
type CanvasControlTab = 'frame-cells' | 'free-draw' | 'queens' | 'bees' | 'varroa-mites'

let points: DrawingPoint[] = [];
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
const DEFAULT_BRUSH_DIAMETER_RATIO = 0.15;
const BRUSH_DIAMETER_BY_PRESET: Record<BrushSizePreset, number> = {
	small: DEFAULT_BRUSH_DIAMETER_RATIO * 0.6,
	medium: DEFAULT_BRUSH_DIAMETER_RATIO,
	large: DEFAULT_BRUSH_DIAMETER_RATIO * 1.4,
};
const DEFAULT_NEW_CELL_RADIUS_RATIO = 0.006;
const CELL_SHORTCUTS: Record<string, NonEraseBrushCellType> = {
	n: 4,
	y: 2,
	p: 6,
	g: 1,
	b: 3,
	k: 0,
	d: 7,
	u: 5,
};
const CELL_TYPE_HINTS: Record<NonEraseBrushCellType, string> = {
	4: 'N',
	2: 'Y',
	6: 'P',
	1: 'G',
	3: 'B',
	0: 'K',
	7: 'D',
	5: 'U',
};

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

const RANDOM_QUEEN_NAME_QUERY = gql`
	query RandomHiveName($language: String) {
		randomHiveName(language: $language)
	}
`;

function clampCameraOffset(canvas: HTMLCanvasElement) {
	const minX = canvas.width - canvas.width * globalCameraZoom;
	const minY = canvas.height - canvas.height * globalCameraZoom;
	offsetsum.x = Math.min(0, Math.max(minX, offsetsum.x));
	offsetsum.y = Math.min(0, Math.max(minY, offsetsum.y));
}

function calculateRelPx(canvas: HTMLCanvasElement) {
	return canvas.width / 1024;
}

function drawStrokeSegment(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, stroke: DrawingPoint[]) {
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

function redrawStrokes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, strokeHistory: DrawingLine[]) {
	strokeHistory.forEach((stroke) => {
		if (stroke && stroke.length > 0) {
			ctx.beginPath();
			let currentPath: DrawingPoint[] = [];
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
		case 7: return { stroke: colors.droneBroodColor, fill: colors.droneBroodColor };
		default: return { stroke: 'grey', fill: 'grey' };
	}
}

function getContrastingTextColor(background: string): string {
	const rgbMatch = background.match(/\d+/g);
	if (!rgbMatch || rgbMatch.length < 3) {
		// Fallback for named/hex colors
		return background === '#FFD900' || background === 'rgb(255 219 127)' ? '#111' : '#fff';
	}
	const [r, g, b] = rgbMatch.slice(0, 3).map(Number);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.6 ? '#111' : '#fff';
}

function drawDetectedCells(
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

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function drawBrushPreview(
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

function applyCellBrush(
	sourceCells: any[],
	center: { x: number; y: number },
	selectedCellType: BrushCellType,
	brushRadiusRatio: number,
	canvasWidthToHeight: number
): { cells: any[]; changed: boolean } {
	const inputCells = Array.isArray(sourceCells) ? sourceCells : [];
	const result: any[] = [];
	const brushRadius = brushRadiusRatio;
	const safeCanvasWidthToHeight = Number.isFinite(canvasWidthToHeight) && canvasWidthToHeight > 0
		? canvasWidthToHeight
		: 1;
	const xToBrushSpace = (xDelta: number) => xDelta * safeCanvasWidthToHeight;
	const brushDistanceSq = (xDelta: number, yDelta: number) => {
		const scaledDx = xToBrushSpace(xDelta);
		return (scaledDx * scaledDx) + (yDelta * yDelta);
	};
	const brushRadiusSq = brushRadius * brushRadius;
	let touchedCells = 0;
	let changed = false;
	const deriveMedianRadius = (cells: any[]): number => {
		const radii = cells
			.filter((cell) => Array.isArray(cell) && typeof cell[3] === 'number' && Number.isFinite(cell[3]) && cell[3] > 0)
			.map((cell) => cell[3] as number)
			.sort((a, b) => a - b);
		if (radii.length === 0) return DEFAULT_NEW_CELL_RADIUS_RATIO;
		return radii[Math.floor(radii.length / 2)];
	};

	const hasCircleCollision = (
		cells: any[],
		x: number,
		y: number,
		radius: number
	): boolean => {
		for (const cell of cells) {
			if (!Array.isArray(cell) || cell.length < 4) continue;
			const ex = typeof cell[1] === 'number' ? cell[1] : 0;
			const ey = typeof cell[2] === 'number' ? cell[2] : 0;
			const er = (typeof cell[3] === 'number' && Number.isFinite(cell[3]) && cell[3] > 0)
				? cell[3]
				: radius;
			const minDistance = radius + er;
			const dx = ex - x;
			const dy = ey - y;
			if ((dx * dx + dy * dy) < (minDistance * minDistance)) {
				return true;
			}
		}
		return false;
	};

	for (const cell of inputCells) {
		if (!Array.isArray(cell) || cell.length < 5) continue;
		const [cls, x, y, r, probability] = cell;
		const dx = x - center.x;
		const dy = y - center.y;
		const isInsideBrush = brushDistanceSq(dx, dy) <= brushRadiusSq;

		if (!isInsideBrush) {
			result.push(cell);
			continue;
		}

		touchedCells += 1;
		if (selectedCellType === 'erase') {
			changed = true;
			continue;
		}

		if (cls !== selectedCellType) {
			changed = true;
			result.push([selectedCellType, x, y, r, probability]);
		} else {
			result.push(cell);
		}
	}

	if (selectedCellType !== 'erase') {
		const derivedRadius = deriveMedianRadius(inputCells);
		const verticalStep = derivedRadius * Math.sqrt(3);
		const horizontalStep = derivedRadius * 2;
		const derivedRadiusInBrushSpace = derivedRadius * safeCanvasWidthToHeight;
		const effectiveBrushRadius = Math.max(derivedRadiusInBrushSpace, brushRadius - derivedRadiusInBrushSpace);
		let addedCells = 0;
		const maxAddedCells = 120;

		let rowIndex = 0;
		for (let y = center.y - effectiveBrushRadius; y <= center.y + effectiveBrushRadius; y += verticalStep) {
			const rowOffset = (rowIndex % 2 === 0) ? 0 : derivedRadius;
			for (
				let x = center.x - effectiveBrushRadius + rowOffset;
				x <= center.x + effectiveBrushRadius;
				x += horizontalStep
			) {
				const dxBrush = x - center.x;
				const dyBrush = y - center.y;
				// Keep full circle footprint inside brush disk in pixel-accurate brush space.
				if (brushDistanceSq(dxBrush, dyBrush) > (effectiveBrushRadius * effectiveBrushRadius)) {
					continue;
				}

				const clampedX = clamp01(x);
				const clampedY = clamp01(y);
				if (hasCircleCollision(result, clampedX, clampedY, derivedRadius)) {
					continue;
				}

				result.push([
					selectedCellType,
					clampedX,
					clampedY,
					derivedRadius,
					100,
				]);
				addedCells += 1;
				changed = true;
				if (addedCells >= maxAddedCells) {
					break;
				}
			}
			if (addedCells >= maxAddedCells) {
				break;
			}
			rowIndex += 1;
		}

		// Fallback: ensure at least one cell can still be placed in empty area.
		if (touchedCells === 0 && addedCells === 0 && !hasCircleCollision(result, center.x, center.y, derivedRadius)) {
			result.push([
				selectedCellType,
				clamp01(center.x),
				clamp01(center.y),
				derivedRadius,
				100,
			]);
			changed = true;
		}
	}

	return { cells: result, changed };
}

function drawDetectedVarroa(detectedVarroa: any[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
	const relPx = calculateRelPx(canvas);
	detectedVarroa.forEach(({ c, x, y, w }) => {
		ctx.globalAlpha = 0.5 + c / 100;
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		ctx.lineWidth = 8 * relPx;
		// ctx.arc(x * canvas.width, y * canvas.height, w * canvas.width * 1.5, 0, 2 * Math.PI);

		const radius = (w / 2) * canvas.width;
		ctx.lineWidth = 4 * relPx; // Optional: adjust line width
		ctx.arc(x * canvas.width, y * canvas.height, radius, 0, 2 * Math.PI);

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
	REL_PX = relPx;

	detectedBees.forEach((dt, index) => {
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
	const containerWidth = parentContainer
		? parentContainer.clientWidth
		: document.documentElement.clientWidth;
	const isMobileView = document.body.clientWidth < 1200;
	zoomEnabled = !isMobileView;

	// Use container clientWidth (not measured canvas width) so shrink works reliably.
	const cssWidth = Math.max(Math.floor(containerWidth), 1);
	const cssHeight = Math.max(Math.floor(cssWidth * (imgHeight / imgWidth)), 1);

	canvas.width = Math.floor(cssWidth * dpr);
	canvas.height = Math.floor(cssHeight * dpr);
	canvas.style.width = '100%';
	canvas.style.height = `${cssHeight}px`;
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
	brushCursor?: { x: number; y: number } | null;
	isAddingQueenMarker?: boolean;
	canCellBrushPreview?: boolean;
	activeTool?: 'cell-brush' | 'stroke';
	selectedCellType?: BrushCellType;
	brushRadiusRatio?: number;
}

function drawQueenAnnotations(
	queenAnnotations: QueenAnnotation[],
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	familyNameById: Record<number, string>
) {
	if (!Array.isArray(queenAnnotations)) return;
	const relPx = calculateRelPx(canvas);
	queenAnnotations.forEach((annotation) => {
		const x = Number(annotation?.x);
		const y = Number(annotation?.y);
		const radiusRatio = Number(annotation?.radius);
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;

		const radius = (Number.isFinite(radiusRatio) && radiusRatio > 0 ? radiusRatio : 0.02) * canvas.width * 1.5;
		const isApproved = annotation?.status === 'approved';
		ctx.save();
		ctx.globalAlpha = isApproved ? 0.85 : 0.65;
		ctx.beginPath();
		ctx.arc(x * canvas.width, y * canvas.height, radius, 0, 2 * Math.PI);
		ctx.fillStyle = isApproved ? 'rgba(36, 112, 255, 0.18)' : 'rgba(36, 112, 255, 0.08)';
		ctx.fill();
		// Layered ring: white base stroke + blue stroke on top to create inner/outer outline effect.
		const blueStrokeWidth = Math.max(1, 1.2 * relPx);
		const whiteStrokeWidth = blueStrokeWidth + Math.max(2, 1.8 * relPx);
		ctx.lineWidth = whiteStrokeWidth;
		ctx.strokeStyle = '#ffffff';
		ctx.stroke();
		ctx.lineWidth = blueStrokeWidth;
		ctx.strokeStyle = isApproved ? '#1f5eff' : '#6fa2ff';
		ctx.stroke();
		const familyId = Number(annotation?.familyId);
		const queenName = Number.isFinite(familyId) && familyId > 0 ? (familyNameById[familyId] || '') : '';
		if (queenName) {
			const fontSize = Math.floor(Math.max(11, 10 * relPx));
			const labelX = (x * canvas.width) + radius + (4 * relPx);
			const labelY = y * canvas.height;
			const textPaddingX = Math.max(3, 3 * relPx);
			const textPaddingY = Math.max(2, 2 * relPx);
			ctx.font = `${fontSize}px Arial`;
			ctx.textBaseline = 'middle';
			const textWidth = ctx.measureText(queenName).width;
			const boxX = labelX - textPaddingX;
			const boxY = labelY - (fontSize / 2) - textPaddingY;
			const boxW = textWidth + (textPaddingX * 2);
			const boxH = fontSize + (textPaddingY * 2);
			ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
			ctx.fillRect(boxX, boxY, boxW, boxH);
			ctx.fillStyle = '#1252d6';
			ctx.fillText(queenName, labelX, labelY);
		}
		ctx.restore();
	});
}

function drawQueenPlacementPreview(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	brushCursor: { x: number; y: number },
	radiusRatio = 0.022
) {
	const relPx = calculateRelPx(canvas);
	ctx.save();
	ctx.globalAlpha = 0.95;
	ctx.beginPath();
	ctx.arc(
		brushCursor.x * canvas.width,
		brushCursor.y * canvas.height,
		radiusRatio * canvas.width,
		0,
		2 * Math.PI
	);
	ctx.lineWidth = Math.max(2, 2.2 * relPx);
	ctx.strokeStyle = '#1f5eff';
	ctx.stroke();
	ctx.restore();
}

function drawCanvasLayers({
	canvas, ctx, strokeHistory, showDetectedCells = true, showBees, showDrones, isAiQueenVisible,
	detectedBees, detectedCells, showQueenCups, detectedQueenCups,
	showVarroa, detectedVarroa, showQueenAnnotations = true, queenAnnotations = [], familyNameById = {},
	brushCursor, isAddingQueenMarker = false, canCellBrushPreview = false, activeTool, selectedCellType, brushRadiusRatio = DEFAULT_BRUSH_DIAMETER_RATIO / 2,
	cellsOpacityFactor = 1
}: DrawLayersParams) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	if (img) {
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
	strokeHistory: DrawingLine[];
	detectedQueenCups?: any[];
	detectedBees?: any[];
	detectedDrones?: any[];
	detectedCells?: any[];
	detectedVarroa?: any[];
	queenAnnotations?: QueenAnnotation[];
	families?: Array<{ id: number; name?: string; added?: string; color?: string; lastSeenFrameId?: number; lastSeenFrameSideId?: number }>;
	currentFrameId?: number;
	onStrokeHistoryUpdate: (history: DrawingLine[] | undefined) => void;
	onDetectedCellsUpdate?: (detectedCells: any[]) => void | Promise<void>;
	onQueenAnnotationsUpdate?: (queenAnnotations: QueenAnnotation[]) => void | Promise<void>;
	onRemoveDetectedQueenCandidate?: (target: { x: number; y: number }) => void | Promise<void>;
	onCreateQueen?: (queen: { name?: string; race?: string; added?: string; color?: string | null }) => Promise<number | null>;
	frameSideFile: any;
	hideControls?: boolean;
	allowDrawing?: boolean;
	saveRequestId?: number;
	onCellEditsStateChange?: (state: { hasUnsaved: boolean; isSaving: boolean }) => void;
}

export default function DrawingCanvas({
	imageUrl,
	resizes = [],
	strokeHistory = [],
	detectedQueenCups = [],
	detectedBees = [],
	detectedDrones = [],
	detectedCells = [],
	detectedVarroa = [],
	queenAnnotations = [],
	families = [],
	currentFrameId,
	onStrokeHistoryUpdate,
	onDetectedCellsUpdate,
	onQueenAnnotationsUpdate,
	onRemoveDetectedQueenCandidate,
	onCreateQueen,
	frameSideFile,
	hideControls = false,
	allowDrawing = true,
	saveRequestId = 0,
	onCellEditsStateChange = () => {},
}: DrawingCanvasProps) {

	const ref = useRef<HTMLCanvasElement>(null);
	const [showBees, setBeeVisibility] = useState(true);
	const [showDrones, setDroneVisibility] = useState(true);
	const [showQueenCups, setQueenCupsVisibility] = useState(true);
	const [showVarroa, setShowVarroaVisibility] = useState(true);
	const [showQueenAnnotations, setShowQueenAnnotations] = useState(true);
	const [isAiQueenVisible, setIsAiQueenVisible] = useState(true);
	const [showFrameCells, setShowFrameCells] = useState(true);
	const [activeControlTab, setActiveControlTab] = useState<CanvasControlTab>('frame-cells');
	const [currentLineWidth, setCurrentLineWidth] = useState(0);
	const [activeTool, setActiveTool] = useState<'cell-brush' | 'stroke'>('cell-brush');
	const [selectedCellType, setSelectedCellType] = useState<BrushCellType>(2);
	const [brushSizePreset, setBrushSizePreset] = useState<BrushSizePreset>('medium');
	const [cellsOpacityPercent, setCellsOpacityPercent] = useState(50);
	const [hasUnsavedCellEdits, setHasUnsavedCellEdits] = useState(false);
	const [isSavingCellEdits, setIsSavingCellEdits] = useState(false);
	const [editableQueenAnnotations, setEditableQueenAnnotations] = useState<QueenAnnotation[]>(queenAnnotations || []);
	const [isAddingQueenMarker, setIsAddingQueenMarker] = useState(false);
	const [pendingMarkerFamilyId, setPendingMarkerFamilyId] = useState<number | null>(null);
	const [isCreateQueenModalOpen, setIsCreateQueenModalOpen] = useState(false);
	const [newQueenName, setNewQueenName] = useState('');
	const [newQueenRace, setNewQueenRace] = useState('');
	const [newQueenYear, setNewQueenYear] = useState(String(new Date().getFullYear()));
	const [newQueenColor, setNewQueenColor] = useState<string | null>(null);
	const [isCreatingQueen, setIsCreatingQueen] = useState(false);
	const [nameSuggestionLang, setNameSuggestionLang] = useState('en');
	const user = useLiveQuery(() => getUser(), [], null);
	const {
		data: randomNameData,
		loading: randomNameLoading,
		reexecuteQuery: reexecuteRandomNameQuery,
	} = useQuery(RANDOM_QUEEN_NAME_QUERY, { variables: { language: nameSuggestionLang } });
	const editableDetectedCellsRef = useRef<any[]>(detectedCells || []);
	const lastHandledSaveRequestIdRef = useRef(0);
	const brushCursorRef = useRef<{ x: number; y: number } | null>(null);
	const lastBrushCenterRef = useRef<{ x: number; y: number } | null>(null);
	const redrawRafRef = useRef<number | null>(null);
	const cellEditChangedRef = useRef(false);

	useEffect(() => {
		if (hasUnsavedCellEdits) return;
		editableDetectedCellsRef.current = detectedCells || [];
	}, [detectedCells, hasUnsavedCellEdits]);

	useEffect(() => {
		let lang = 'en';
		if (user?.lang) {
			lang = user.lang;
		} else if (user === null && typeof navigator !== 'undefined') {
			const browserLang = navigator.language.substring(0, 2) as any;
			if (SUPPORTED_LANGUAGES.includes(browserLang)) {
				lang = browserLang;
			}
		}
		setNameSuggestionLang(lang);
	}, [user]);

	useEffect(() => {
		if (randomNameData?.randomHiveName && !randomNameLoading) {
			setNewQueenName(String(randomNameData.randomHiveName || ''));
		}
	}, [randomNameData, randomNameLoading]);

	useEffect(() => {
		setEditableQueenAnnotations(Array.isArray(queenAnnotations) ? queenAnnotations : []);
	}, [queenAnnotations]);

	const persistQueenAnnotations = useCallback(async (nextAnnotations: QueenAnnotation[]) => {
		setEditableQueenAnnotations(nextAnnotations);
		if (onQueenAnnotationsUpdate) {
			await onQueenAnnotationsUpdate(nextAnnotations);
		}
	}, [onQueenAnnotationsUpdate]);

	const upsertQueenAnnotation = useCallback(async (id: string, updater: (annotation: QueenAnnotation) => QueenAnnotation) => {
		const next = editableQueenAnnotations.map((annotation) => (
			annotation.id === id ? updater(annotation) : annotation
		));
		await persistQueenAnnotations(next);
	}, [editableQueenAnnotations, persistQueenAnnotations]);

	const removeQueenAnnotation = useCallback(async (annotation: QueenAnnotation) => {
		const next = editableQueenAnnotations.filter((item) => item.id !== annotation.id);
		await persistQueenAnnotations(next);
	}, [editableQueenAnnotations, persistQueenAnnotations]);

	const handleAssignFamily = useCallback(async (annotation: QueenAnnotation, value: string) => {
		const familyId = value ? Number(value) : null;
		await upsertQueenAnnotation(annotation.id, (current) => ({
			...current,
			familyId,
			status: familyId ? 'approved' : current.status,
			updatedAt: new Date().toISOString(),
		}));
	}, [upsertQueenAnnotation]);

	const onStartMarkExistingQueen = useCallback(() => {
		if (isAddingQueenMarker && pendingMarkerFamilyId === null) {
			setIsAddingQueenMarker(false);
			return;
		}
		setPendingMarkerFamilyId(null);
		setIsAddingQueenMarker(true);
	}, [isAddingQueenMarker, pendingMarkerFamilyId]);

	const onOpenMarkNewQueenModal = useCallback(() => {
		const suggestedName = String(randomNameData?.randomHiveName || '').trim();
		setNewQueenName(suggestedName);
		setNewQueenRace('');
		setNewQueenYear(String(new Date().getFullYear()));
		setNewQueenColor(null);
		setIsCreateQueenModalOpen(true);
		if (!suggestedName) {
			reexecuteRandomNameQuery({ requestPolicy: 'network-only' });
		}
	}, [randomNameData, reexecuteRandomNameQuery]);

	const onRefreshQueenName = useCallback(() => {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' });
	}, [reexecuteRandomNameQuery]);

	const onConfirmCreateQueen = useCallback(async () => {
		const year = String(newQueenYear || '').trim();
		if (year && !/^\d{4}$/.test(year)) {
			window.alert('Year must be 4 digits (e.g. 2026).');
			return;
		}
		if (!onCreateQueen) {
			window.alert('Creating a queen is not available in this view.');
			return;
		}
		setIsCreatingQueen(true);
		try {
			const createdFamilyId = await onCreateQueen({
				name: newQueenName.trim() || undefined,
				race: newQueenRace.trim() || undefined,
				added: year || undefined,
				color: newQueenColor,
			});
			if (!createdFamilyId) {
				window.alert('Failed to create queen.');
				return;
			}
			setPendingMarkerFamilyId(Number(createdFamilyId));
			setIsCreateQueenModalOpen(false);
			setIsAddingQueenMarker(true);
		} finally {
			setIsCreatingQueen(false);
		}
	}, [newQueenName, newQueenRace, newQueenYear, newQueenColor, onCreateQueen]);

	const allDetectedBees = React.useMemo(() => {
		const combined = [...(detectedBees || [])];
		if (detectedDrones && detectedDrones.length > 0) {
			combined.push(...detectedDrones);
		}
		return combined;
	}, [detectedBees, detectedDrones]); // Track line width for drawing updates
	const currentFrameSideId = Number(frameSideFile?.frameSideId);
	const familyNameById = React.useMemo(() => {
		const map: Record<number, string> = {};
		for (const family of families || []) {
			const numericId = Number(family?.id);
			if (!Number.isFinite(numericId)) continue;
			const name = String(family?.name || '').trim();
			if (name) map[numericId] = name;
		}
		return map;
	}, [families]);
	const familyById = React.useMemo(() => {
		const map = new Map<number, { id: number; name?: string; added?: string; color?: string }>();
		for (const family of families || []) {
			const numericId = Number(family?.id);
			if (!Number.isFinite(numericId) || numericId <= 0) continue;
			map.set(numericId, family);
		}
		return map;
	}, [families]);
	const occupiedFamilyIds = React.useMemo(
		() => buildOccupiedFamilyIds({
			queenAnnotations: editableQueenAnnotations || [],
			families: families || [],
			currentFrameId,
			currentFrameSideId,
		}),
		[editableQueenAnnotations, families, currentFrameId, currentFrameSideId]
	);

	const brushRadiusRatio = BRUSH_DIAMETER_BY_PRESET[brushSizePreset] / 2;
	const showAiQueensOnCanvas = allowDrawing ? isAiQueenVisible : false;
	const canCellBrush = allowDrawing && activeControlTab === 'frame-cells';
	const canStrokeDraw = allowDrawing && activeControlTab === 'free-draw';
	const showQueenAnnotationsOnCanvas = showQueenAnnotations;
	const readOnlyQueenMarkers = React.useMemo(
		() => (editableQueenAnnotations || []).filter(
			(annotation) => !(annotation?.source === 'ai' && annotation?.status !== 'approved')
		),
		[editableQueenAnnotations]
	);
	const queenAnnotationsOnCanvas = allowDrawing ? editableQueenAnnotations : readOnlyQueenMarkers;
	const showQueenCupsOnCanvas = allowDrawing ? showQueenCups : false;
	const showVarroaOnCanvas = allowDrawing ? showVarroa : false;
	const showDetectedCellsOnCanvas = allowDrawing ? true : showFrameCells;
	const cellsOpacityFactor = allowDrawing
		? cellsOpacityPercent / 100
		: 0.5;

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

	const increaseBrushPreset = useCallback(() => {
		setBrushSizePreset((prev) => {
			if (prev === 'small') return 'medium';
			if (prev === 'medium') return 'large';
			return 'large';
		});
	}, []);

	const decreaseBrushPreset = useCallback(() => {
		setBrushSizePreset((prev) => {
			if (prev === 'large') return 'medium';
			if (prev === 'medium') return 'small';
			return 'small';
		});
	}, []);

	const clearHistory = useCallback(() => {
		if (!allowDrawing) return;
		points = [];
		onStrokeHistoryUpdate([]);
	}, [allowDrawing, onStrokeHistoryUpdate]);

	const undoDraw = useCallback(() => {
		if (!allowDrawing) return;
		const newHistory: DrawingLine[] = [...strokeHistory];
		newHistory.pop();
		onStrokeHistoryUpdate(newHistory);
	}, [allowDrawing, strokeHistory, onStrokeHistoryUpdate]);

	const redrawCurrentCanvas = useCallback(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		drawCanvasLayers({
			canvas, ctx, strokeHistory, showDetectedCells: showDetectedCellsOnCanvas, showBees, showDrones, isAiQueenVisible: showAiQueensOnCanvas,
			detectedBees: allDetectedBees,
			detectedCells: editableDetectedCellsRef.current,
			showQueenCups: showQueenCupsOnCanvas,
			detectedQueenCups,
			showVarroa: showVarroaOnCanvas,
			detectedVarroa,
			showQueenAnnotations: showQueenAnnotationsOnCanvas,
			queenAnnotations: queenAnnotationsOnCanvas,
			familyNameById,
			brushCursor: brushCursorRef.current,
			isAddingQueenMarker,
			canCellBrushPreview: canCellBrush,
			activeTool,
			selectedCellType,
			brushRadiusRatio,
			cellsOpacityFactor,
		});
	}, [strokeHistory, showDetectedCellsOnCanvas, showBees, showDrones, showAiQueensOnCanvas, allDetectedBees, showQueenCupsOnCanvas, detectedQueenCups, showVarroaOnCanvas, detectedVarroa, showQueenAnnotationsOnCanvas, queenAnnotationsOnCanvas, familyNameById, isAddingQueenMarker, canCellBrush, activeTool, selectedCellType, brushRadiusRatio, cellsOpacityFactor]);

	const scheduleRedraw = useCallback(() => {
		if (redrawRafRef.current !== null) return;
		redrawRafRef.current = window.requestAnimationFrame(() => {
			redrawRafRef.current = null;
			redrawCurrentCanvas();
		});
	}, [redrawCurrentCanvas]);

	useEffect(() => {
		scheduleRedraw();
	}, [detectedCells, scheduleRedraw]);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas || isPanning) return;
		if (!allowDrawing) {
			canvas.style.cursor = 'default';
			return;
		}
		canvas.style.cursor = isAddingQueenMarker
			? 'pointer'
			: activeControlTab === 'free-draw'
				? 'crosshair'
				: activeControlTab === 'frame-cells'
					? 'all-scroll'
					: 'default';
	}, [activeControlTab, isAddingQueenMarker, allowDrawing]);

	useEffect(() => {
		// Reset camera state when switching frame image to avoid stale zoom/pan jumps.
		globalCameraZoom = 1;
		offsetsum = { x: 0, y: 0 };
		isPanning = false;
		isMousedown = false;
		points = [];
		cellEditChangedRef.current = false;
		brushCursorRef.current = null;
		lastBrushCenterRef.current = null;
	}, [imageUrl]);

	useEffect(() => {
		return () => {
			if (redrawRafRef.current !== null) {
				window.cancelAnimationFrame(redrawRafRef.current);
				redrawRafRef.current = null;
			}
		};
	}, []);


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
		}, 150);

		window.addEventListener('resize', handleResize);

		const resizeObserver =
			typeof ResizeObserver !== 'undefined'
				? new ResizeObserver(() => handleResize())
				: null;
		if (resizeObserver && canvas.parentElement) {
			resizeObserver.observe(canvas.parentElement);
		}

		return () => {
			window.removeEventListener('resize', handleResize);
			resizeObserver?.disconnect();
		};
	}, [redrawCurrentCanvas]); // Re-attach resize listener if redraw logic changes

	// Drawing Event Handlers
	useLayoutEffect(() => {
		if (!allowDrawing) return;
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const updateBrushCursor = (e: MouseEvent | TouchEvent) => {
			if (!canCellBrush || activeTool !== 'cell-brush') return;
			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos);
			brushCursorRef.current = {
				x: clamp01(normalizedPos.x),
				y: clamp01(normalizedPos.y),
			};
			scheduleRedraw();
		};

		const applyBrushAtEvent = (e: MouseEvent | TouchEvent) => {
			if (!canCellBrush || activeTool !== 'cell-brush') return;
			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos);
			const clampedCenter = { x: clamp01(normalizedPos.x), y: clamp01(normalizedPos.y) };
			const getMedianRadius = (cells: any[]): number => {
				const radii = cells
					.filter((cell) => Array.isArray(cell) && typeof cell[3] === 'number' && Number.isFinite(cell[3]) && cell[3] > 0)
					.map((cell) => cell[3] as number)
					.sort((a, b) => a - b);
				if (radii.length === 0) return DEFAULT_NEW_CELL_RADIUS_RATIO;
				return radii[Math.floor(radii.length / 2)];
			};

			const applyBrushAlongPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
				const dx = to.x - from.x;
				const dy = to.y - from.y;
				const distance = Math.hypot(dx, dy);
				const medianRadius = getMedianRadius(editableDetectedCellsRef.current);
				const step = Math.max(0.003, medianRadius * 0.8);
				const steps = Math.max(1, Math.min(64, Math.ceil(distance / step)));

				let workingCells = editableDetectedCellsRef.current;
				let changedAny = false;

				for (let i = 1; i <= steps; i++) {
					const t = i / steps;
					const center = {
						x: clamp01(from.x + dx * t),
						y: clamp01(from.y + dy * t),
					};

					const { cells: nextCells, changed } = applyCellBrush(
						workingCells,
						center,
						selectedCellType,
						brushRadiusRatio,
						canvas.width / canvas.height
					);

					if (changed) {
						workingCells = nextCells;
						changedAny = true;
					}
				}

				if (changedAny) {
					cellEditChangedRef.current = true;
					editableDetectedCellsRef.current = workingCells;
					if (!hasUnsavedCellEdits) {
						setHasUnsavedCellEdits(true);
					}
				}
			};

			const from = lastBrushCenterRef.current || clampedCenter;
			applyBrushAlongPath(from, clampedCenter);
			lastBrushCenterRef.current = clampedCenter;
			brushCursorRef.current = clampedCenter;
			scheduleRedraw();
		};

		const handleDrawStart = (e: MouseEvent | TouchEvent) => {
			if (isPanning || (e instanceof MouseEvent && e.button !== 0)) return;
			e.preventDefault(); // Prevent scrolling on touch

			if (isAddingQueenMarker) {
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos);
				const newAnnotation: QueenAnnotation = {
					id: `manual-${Date.now()}-${Math.round(Math.random() * 10000)}`,
					x: clamp01(normalizedPos.x),
					y: clamp01(normalizedPos.y),
					radius: 0.022,
					source: 'manual',
					status: 'approved',
					familyId: pendingMarkerFamilyId,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				void persistQueenAnnotations([...(editableQueenAnnotations || []), newAnnotation]);
				setIsAddingQueenMarker(false);
				setPendingMarkerFamilyId(null);
				return;
			}

			if (!canCellBrush && !canStrokeDraw) return;

			if (canCellBrush && activeTool === 'cell-brush') {
				isMousedown = true;
				applyBrushAtEvent(e);
				return;
			}
			if (!canStrokeDraw) return;

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
			updateBrushCursor(e);
			if (!isMousedown || isPanning) return;
			if (!canCellBrush && !canStrokeDraw) return;
			e.preventDefault();

			if (canCellBrush && activeTool === 'cell-brush') {
				applyBrushAtEvent(e);
				return;
			}
			if (!canStrokeDraw) return;

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

		const handleDrawEnd = async (e: MouseEvent | TouchEvent) => {
			if (!isMousedown || isPanning || (e instanceof MouseEvent && e.button !== 0)) return;

			isMousedown = false;
			if (canCellBrush && activeTool === 'cell-brush') {
				cellEditChangedRef.current = false;
				lastBrushCenterRef.current = null;
				return;
			}
			if (!canStrokeDraw) {
				lastBrushCenterRef.current = null;
				return;
			}

			if (points.length > 0) {
				let newHistory: DrawingLine[] = [[...points]];

				if(strokeHistory && strokeHistory.length > 0) {
					newHistory = [...strokeHistory, ...newHistory];
				}

				await onStrokeHistoryUpdate(newHistory);
			}
			setCurrentLineWidth(0);
		};

		const handleDrawLeave = async (e: MouseEvent | TouchEvent) => {
			brushCursorRef.current = null;
			lastBrushCenterRef.current = null;
			scheduleRedraw();
			await handleDrawEnd(e);
		};

		canvas.addEventListener('mousedown', handleDrawStart);
		canvas.addEventListener('touchstart', handleDrawStart, { passive: false });
		canvas.addEventListener('mousemove', handleDrawMove);
		canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
		canvas.addEventListener('mouseup', handleDrawEnd);
		canvas.addEventListener('mouseleave', handleDrawLeave); // End draw if mouse leaves canvas
		canvas.addEventListener('touchend', handleDrawEnd);
		canvas.addEventListener('touchcancel', handleDrawEnd);

		return () => {
			canvas.removeEventListener('mousedown', handleDrawStart);
			canvas.removeEventListener('touchstart', handleDrawStart);
			canvas.removeEventListener('mousemove', handleDrawMove);
			canvas.removeEventListener('touchmove', handleDrawMove);
			canvas.removeEventListener('mouseup', handleDrawEnd);
			canvas.removeEventListener('mouseleave', handleDrawLeave);
			canvas.removeEventListener('touchend', handleDrawEnd);
			canvas.removeEventListener('touchcancel', handleDrawEnd);
		};
	}, [allowDrawing, strokeHistory, onStrokeHistoryUpdate, currentLineWidth, activeTool, selectedCellType, scheduleRedraw, hasUnsavedCellEdits, brushRadiusRatio, isAddingQueenMarker, pendingMarkerFamilyId, editableQueenAnnotations, persistQueenAnnotations, canCellBrush, canStrokeDraw]); // Dependencies for drawing logic

	// Zoom and Pan Event Handlers
	useLayoutEffect(() => {
		const canvas = ref.current;
		if (!canvas || !zoomEnabled) return; // Only attach if zoom is enabled
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const getIdleCursor = () => (
			!allowDrawing
				? 'default'
				: isAddingQueenMarker
				? 'pointer'
				: activeControlTab === 'free-draw'
					? 'crosshair'
					: activeControlTab === 'frame-cells'
						? 'all-scroll'
						: 'default'
		);

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
				if (globalCameraZoom === 1) {
					offsetsum = { x: 0, y: 0 };
				}

				offsetsum.x = mousePos.x - mouseXInWorldBeforeZoom * globalCameraZoom;
				offsetsum.y = mousePos.y - mouseYInWorldBeforeZoom * globalCameraZoom;
				clampCameraOffset(canvas);

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
				clampCameraOffset(canvas);

				ctx.setTransform(globalCameraZoom, 0, 0, globalCameraZoom, offsetsum.x, offsetsum.y);
				redrawCurrentCanvas();
		};

		const handlePanEnd = () => {
			if (isPanning) {
				isPanning = false;
				canvas.style.cursor = getIdleCursor();
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
	}, [imageUrl, canvasUrl, redrawCurrentCanvas, zoomEnabled, activeControlTab, isAddingQueenMarker, allowDrawing]); // Re-attach if cursor mode changes

	// Redraw when visibility toggles change
	useEffect(() => {
		redrawCurrentCanvas();
	}, [showBees, showDrones, isAiQueenVisible, showQueenCups, showVarroa, showQueenAnnotations, redrawCurrentCanvas]);

	// Redraw when detection data changes
	useEffect(() => {
		redrawCurrentCanvas();
	}, [detectedBees, detectedCells, detectedQueenCups, detectedVarroa, editableQueenAnnotations, redrawCurrentCanvas]);


	const isAnyDetectionLoading =
		!(
			frameSideFile?.isBeeDetectionComplete ||
			frameSideFile?.isDroneDetectionComplete ||
			(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
			(frameSideFile?.detectedDroneCount || 0) > 0 ||
			(detectedBees?.length || 0) > 0 ||
			(detectedDrones?.length || 0) > 0
		) ||
		!frameSideFile?.isCellsDetectionComplete ||
		!frameSideFile?.isQueenCupsDetectionComplete ||
		!frameSideFile?.isQueenDetectionComplete; // Added queen detection check

	useEffect(() => {
		console.debug('[DrawingCanvas] detection flags', {
			frameSideId: frameSideFile?.frameSideId,
			isBeeDetectionComplete: frameSideFile?.isBeeDetectionComplete,
			isDroneDetectionComplete: frameSideFile?.isDroneDetectionComplete,
			isCellsDetectionComplete: frameSideFile?.isCellsDetectionComplete,
			isQueenCupsDetectionComplete: frameSideFile?.isQueenCupsDetectionComplete,
			isQueenDetectionComplete: frameSideFile?.isQueenDetectionComplete,
			detectedWorkerBeeCount: frameSideFile?.detectedWorkerBeeCount,
			detectedDroneCount: frameSideFile?.detectedDroneCount,
			detectedQueenCount: frameSideFile?.detectedQueenCount,
			isAnyDetectionLoading,
		});
	}, [frameSideFile, isAnyDetectionLoading]);

	if (!imageUrl) {
		return <div><T>Loading image...</T></div>;
	}

	const cellTypeOptions: Array<{ value: BrushCellType; label: string }> = [
		{ value: 4, label: 'Nectar' },
		{ value: 2, label: 'Honey' },
		{ value: 6, label: 'Pollen' },
		{ value: 1, label: 'Eggs' },
		{ value: 3, label: 'Brood' },
		{ value: 0, label: 'Capped brood' },
		{ value: 7, label: 'Drone brood' },
		{ value: 5, label: 'Empty' },
		{ value: 'erase', label: 'Eraser' },
	];
	const layerToggleButtonStyle = {
		background: '#fff',
		color: '#111',
		border: '1px solid #d6d6d6',
	};

	useEffect(() => {
		if (!allowDrawing) return;
		if (activeControlTab === 'frame-cells') {
			setActiveTool('cell-brush');
		} else if (activeControlTab === 'free-draw') {
			setActiveTool('stroke');
		}
		if (activeControlTab !== 'frame-cells') {
			brushCursorRef.current = null;
			lastBrushCenterRef.current = null;
			scheduleRedraw();
		}
	}, [activeControlTab, allowDrawing]);

	const onSaveCellEdits = useCallback(async () => {
		if (!onDetectedCellsUpdate || !hasUnsavedCellEdits || isSavingCellEdits) return;
		setIsSavingCellEdits(true);
		let savedOk = false;
		onCellEditsStateChange({ hasUnsaved: hasUnsavedCellEdits, isSaving: true });
		try {
			await onDetectedCellsUpdate(editableDetectedCellsRef.current);
			savedOk = true;
			setHasUnsavedCellEdits(false);
		} finally {
			setIsSavingCellEdits(false);
			onCellEditsStateChange({ hasUnsaved: !savedOk, isSaving: false });
		}
	}, [onDetectedCellsUpdate, hasUnsavedCellEdits, isSavingCellEdits, onCellEditsStateChange]);

	useEffect(() => {
		onCellEditsStateChange({ hasUnsaved: hasUnsavedCellEdits, isSaving: isSavingCellEdits });
	}, [hasUnsavedCellEdits, isSavingCellEdits, onCellEditsStateChange]);

	useEffect(() => {
		if (!saveRequestId) return;
		if (saveRequestId === lastHandledSaveRequestIdRef.current) return;
		lastHandledSaveRequestIdRef.current = saveRequestId;
		onSaveCellEdits();
	}, [saveRequestId, onSaveCellEdits]);

	useEffect(() => {
		if (!allowDrawing) return;

		const isTypingTarget = (target: EventTarget | null) => {
			const element = target as HTMLElement | null;
			if (!element) return false;
			const tagName = String(element.tagName || '').toLowerCase();
			return (
				element.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			);
		};

		const isModalTarget = (target: EventTarget | null) => {
			const element = target as HTMLElement | null;
			if (!element || typeof element.closest !== 'function') return false;
			return Boolean(element.closest('[class*="modalOverlay"], [class*="modalContent"]'));
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return;
			if (event.repeat) return;
			if (isTypingTarget(event.target)) return;
			if (isModalTarget(event.target)) return;

			const key = String(event.key || '');
			const lowerKey = key.toLowerCase();
			let handled = false;

			const isUndoShortcut =
				(event.ctrlKey || event.metaKey) &&
				!event.altKey &&
				lowerKey === 'z';
			if (isUndoShortcut) {
				undoDraw();
				handled = true;
			}

			if (event.ctrlKey || event.metaKey) {
				if (handled) {
					event.preventDefault();
					event.stopPropagation();
				}
				return;
			}

			if (!event.altKey && !event.shiftKey) {
				const nextCellType = CELL_SHORTCUTS[lowerKey];
				if (nextCellType !== undefined) {
					setActiveControlTab('frame-cells');
					setSelectedCellType(nextCellType);
					handled = true;
				}
			}

			if (!event.altKey && !event.shiftKey) {
				if (lowerKey === 'f') {
					setActiveControlTab('free-draw');
					handled = true;
				} else if (lowerKey === 'c') {
					setActiveControlTab('frame-cells');
					setSelectedCellType((prev) => (prev === 'erase' ? 2 : prev));
					handled = true;
				} else if (lowerKey === 'x') {
					setActiveControlTab('frame-cells');
					setSelectedCellType('erase');
					handled = true;
				}
			}

			const isIncreaseKey = key === '+' || key === '=' || event.code === 'NumpadAdd';
			const isDecreaseKey = key === '-' || event.code === 'NumpadSubtract';
			if (!event.altKey && !event.shiftKey && (isIncreaseKey || isDecreaseKey)) {
				if (isIncreaseKey) increaseBrushPreset();
				if (isDecreaseKey) decreaseBrushPreset();
				handled = true;
			}

			if (!handled) return;
			event.preventDefault();
			event.stopPropagation();
		};

		document.addEventListener('keydown', onKeyDown, true);
		return () => {
			document.removeEventListener('keydown', onKeyDown, true);
		};
	}, [allowDrawing, decreaseBrushPreset, increaseBrushPreset, undoDraw]);

	return (
		<div style={{ position: 'relative', overflow: 'hidden' }}>
			{!hideControls && allowDrawing && (
				<TabBar>
					<Tab isSelected={activeControlTab === 'frame-cells'} onClick={() => setActiveControlTab('frame-cells')}>
						<T>Frame cells</T>
					</Tab>
					<Tab isSelected={activeControlTab === 'free-draw'} onClick={() => setActiveControlTab('free-draw')}>
						<T>Free draw</T>
					</Tab>
					<Tab isSelected={activeControlTab === 'queens'} onClick={() => setActiveControlTab('queens')}>
						<T>Queens</T>
					</Tab>
					<Tab isSelected={activeControlTab === 'bees'} onClick={() => setActiveControlTab('bees')}>
						<T>Bees</T>
					</Tab>
					<Tab isSelected={activeControlTab === 'varroa-mites'} onClick={() => setActiveControlTab('varroa-mites')}>
						<T>Varroa mites</T>
					</Tab>
				</TabBar>
			)}
			{!hideControls && !allowDrawing && (
				<div className={styles.buttonPanel}>
					<div className={styles.buttonGrp}>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowFrameCells(!showFrameCells)}>
							{frameSideFile?.isCellsDetectionComplete
								? <Checkbox on={showFrameCells} color="#111" />
								: <Loader size={0} stroke="#111" />
							}
							<span><T ctx="toggle frame cells visibility">Frame cells</T></span>
						</Button>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setBeeVisibility(!showBees)}>
							{
								(
									frameSideFile?.isBeeDetectionComplete ||
									frameSideFile?.isDroneDetectionComplete ||
									(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
									(frameSideFile?.detectedDroneCount || 0) > 0 ||
									(detectedBees?.length || 0) > 0 ||
									(detectedDrones?.length || 0) > 0
								)
									? <Checkbox on={showBees} color="#111" />
									: <Loader size={0} stroke="#111" />
							}
							<span><T ctx="toggle worker bees visibility">Worker bees</T>{frameSideFile?.detectedWorkerBeeCount > 0 && ` (${frameSideFile.detectedWorkerBeeCount})`}</span>
						</Button>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setDroneVisibility(!showDrones)}>
							{
								(
									frameSideFile?.isBeeDetectionComplete ||
									frameSideFile?.isDroneDetectionComplete ||
									(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
									(frameSideFile?.detectedDroneCount || 0) > 0 ||
									(detectedBees?.length || 0) > 0 ||
									(detectedDrones?.length || 0) > 0
								)
									? <Checkbox on={showDrones} color="#111" />
									: <Loader size={0} stroke="#111" />
							}
							<span><T ctx="toggle drones visibility">Drones</T>{frameSideFile?.detectedDroneCount > 0 && ` (${frameSideFile.detectedDroneCount})`}</span>
						</Button>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowQueenAnnotations(!showQueenAnnotations)}>
							<Checkbox on={showQueenAnnotations} color="#111" />
							<span><T ctx="toggle queens visibility">Queens</T>{readOnlyQueenMarkers.length > 0 && ` (${readOnlyQueenMarkers.length})`}</span>
						</Button>
					</div>
				</div>
			)}
			{!hideControls && allowDrawing && (activeControlTab === 'bees' || activeControlTab === 'varroa-mites') && (
				<div className={styles.buttonPanel}>
					<div className={styles.buttonGrp}>
						{activeControlTab === 'bees' && (
							<>
								<Button size="small" style={layerToggleButtonStyle} onClick={() => setBeeVisibility(!showBees)}>
									{
										(
											frameSideFile?.isBeeDetectionComplete ||
											frameSideFile?.isDroneDetectionComplete ||
											(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
											(frameSideFile?.detectedDroneCount || 0) > 0 ||
											(detectedBees?.length || 0) > 0 ||
											(detectedDrones?.length || 0) > 0
										)
											? <Checkbox on={showBees} color="#111" />
											: <Loader size={0} stroke="#111" />
									}
									<span><T ctx="toggle worker bees visibility">Worker bees</T>{frameSideFile?.detectedWorkerBeeCount > 0 && ` (${frameSideFile.detectedWorkerBeeCount})`}</span>
								</Button>

								<Button size="small" style={layerToggleButtonStyle} onClick={() => setDroneVisibility(!showDrones)}>
									{
										(
											frameSideFile?.isBeeDetectionComplete ||
											frameSideFile?.isDroneDetectionComplete ||
											(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
											(frameSideFile?.detectedDroneCount || 0) > 0 ||
											(detectedBees?.length || 0) > 0 ||
											(detectedDrones?.length || 0) > 0
										)
											? <Checkbox on={showDrones} color="#111" />
											: <Loader size={0} stroke="#111" />
									}
									<span><T ctx="toggle drones visibility">Drones</T>{frameSideFile?.detectedDroneCount > 0 && ` (${frameSideFile.detectedDroneCount})`}</span>
								</Button>
							</>
						)}

						{activeControlTab === 'varroa-mites' && (
							<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowVarroaVisibility(!showVarroa)}>
								{
									(
										frameSideFile?.isVarroaDetectionComplete ||
										(frameSideFile?.varroaCount || 0) > 0 ||
										(detectedVarroa?.length || 0) > 0
									)
										? <Checkbox on={showVarroa} color="#111" />
										: <Loader size={0} stroke="#111" />
								}
								<span><T ctx="toggle varroa mites visibility">Varroa mites</T>{frameSideFile?.varroaCount > 0 && ` (${frameSideFile.varroaCount})`}</span>
							</Button>
						)}
					</div>
				</div>
			)}
			{!hideControls && allowDrawing && activeControlTab === 'frame-cells' && (
				<div className={styles.toolbar}>
					<div className={styles.toolbarRow}>
						<div className={styles.toolbarGroup}>
							<Button style={{ opacity: 1 }}>
								<CellBrushIcon size={14} />
								<T>Cell brush</T>
								<KeyboardHints keys="C" />
							</Button>
						</div>
						<div className={`${styles.toolbarGroup} ${styles.toolbarMid}`}>
							<div className={styles.toolbarGroup}>
								<Button
									iconOnly
									title="Small brush"
									onClick={() => setBrushSizePreset('small')}
									style={{
										opacity: brushSizePreset === 'small' ? 1 : 0.82,
										border: brushSizePreset === 'small' ? '2px solid white' : '2px solid transparent',
									}}
								>
									<BrushSizeIcon size={14} dotRadius={2} />
									<KeyboardHints keys="-" />
								</Button>
								<Button
									iconOnly
									title="Medium brush"
									onClick={() => setBrushSizePreset('medium')}
									style={{
										opacity: brushSizePreset === 'medium' ? 1 : 0.82,
										border: brushSizePreset === 'medium' ? '2px solid white' : '2px solid transparent',
									}}
								>
									<BrushSizeIcon size={14} dotRadius={3} />
								</Button>
								<Button
									iconOnly
									title="Large brush"
									onClick={() => setBrushSizePreset('large')}
									style={{
										opacity: brushSizePreset === 'large' ? 1 : 0.82,
										border: brushSizePreset === 'large' ? '2px solid white' : '2px solid transparent',
									}}
								>
									<BrushSizeIcon size={14} dotRadius={4.5} />
									<KeyboardHints keys="+" />
								</Button>
							</div>
						</div>
						<div className={`${styles.toolbarGroup} ${styles.toolbarRight}`}>
							<Button
								onClick={() => setSelectedCellType('erase')}
								style={{
									opacity: selectedCellType === 'erase' ? 1 : 0.82,
									background: 'rgb(90, 90, 90)',
									color: '#fff',
									border: selectedCellType === 'erase' ? '2px solid white' : '2px solid transparent',
								}}
							>
								<EraserIcon size={14} color="#fff" />
								<T>Eraser</T>
								<KeyboardHints keys="X" />
							</Button>
						</div>
					</div>
					<div className={`${styles.toolbarRow} ${styles.toolbarRowSecond}`}>
						<div className={`${styles.toolbarGroup} ${styles.toolbarCellTypes}`}>
							{cellTypeOptions.filter((option) => option.value !== 'erase').map((option) => {
								const isSelected = selectedCellType === option.value;
								const buttonBg = getCellStyle(option.value as number).fill;
								const buttonText = getContrastingTextColor(buttonBg);
								return (
								<Button
									key={String(option.value)}
									size="small"
									className={styles.cellTypeButton}
									onClick={() => setSelectedCellType(option.value)}
									style={{
										opacity: isSelected ? 1 : 0.82,
										background: buttonBg,
										color: buttonText,
										border: isSelected ? '2px solid white' : '2px solid transparent',
									}}
								>
									{option.label}
									<KeyboardHints keys={CELL_TYPE_HINTS[option.value as NonEraseBrushCellType]} />
								</Button>
								);
							})}
						</div>
						<div className={`${styles.toolbarGroup} ${styles.toolbarRight} ${styles.toolbarSliderGroup}`}>
							<span className={styles.toolbarSliderLabel}>
								<T>Cells opacity</T>
							</span>
							<Slider
								backgroundColor="#f0b800"
								value={cellsOpacityPercent}
								width={130}
								min={0}
								max={100}
								onChange={(event: Event) => {
									const nextValue = Number((event.target as HTMLInputElement | null)?.value);
									setCellsOpacityPercent(Number.isFinite(nextValue) ? nextValue : 100);
								}}
							/>
							<span className={styles.toolbarSliderValue}>{cellsOpacityPercent}%</span>
						</div>
					</div>
				</div>
			)}
			{!hideControls && allowDrawing && activeControlTab === 'free-draw' && (
				<div className={styles.toolbar}>
					<div className={styles.toolbarGroup}>
						<Button style={{ opacity: 1 }}>
							<FreeDrawIcon size={14} />
							<T>Free draw</T>
							<KeyboardHints keys="F" />
						</Button>
						<Button onClick={undoDraw}>
							<UndoStrokeIcon size={14} />
							<T>Undo stroke</T>
							<KeyboardHints keys="Ctrl+Z" />
						</Button>
						<Button onClick={clearHistory}>
							<EraserIcon size={14} />
							<T>Clear drawing</T>
						</Button>
					</div>
				</div>
			)}

			{allowDrawing && onQueenAnnotationsUpdate && activeControlTab === 'queens' && (
				<div style={{ marginTop: 10, border: '1px solid #d5dbe5', borderRadius: 8, padding: 10, background: '#f8fbff' }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
							<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowQueenAnnotations(!showQueenAnnotations)}>
								<Checkbox on={showQueenAnnotations} color="#111" />
								<span><T>Queen markers</T></span>
							</Button>
							<Button size="small" style={layerToggleButtonStyle} onClick={() => setIsAiQueenVisible(!isAiQueenVisible)}>
								{frameSideFile?.isQueenDetectionComplete ? <Checkbox on={isAiQueenVisible} color="#111" /> : <Loader size={0} stroke="#111" />}
								<span><T ctx="toggle AI queen visibility">AI queen candidates</T></span>
								<QueenIcon size={14} color={'#111'} />
							</Button>
							{detectedQueenCups && (
								<Button size="small" style={layerToggleButtonStyle} onClick={() => setQueenCupsVisibility(!showQueenCups)}>
									{frameSideFile?.isQueenCupsDetectionComplete ? <Checkbox on={showQueenCups} color="#111" /> : <Loader size={0} stroke="#111" />}
									<span><T ctx="toggle queen cups visibility">Queen cups</T></span>
								</Button>
							)}
						</div>
						<div style={{ display: 'flex', gap: 6 }}>
							<Button
								size="small"
								onClick={onStartMarkExistingQueen}
								style={isAddingQueenMarker && pendingMarkerFamilyId === null ? { background: '#2470ff', color: '#fff' } : undefined}
							>
								<T>{isAddingQueenMarker && pendingMarkerFamilyId === null ? 'Click image to mark existing queen' : 'Mark existing queen'}</T>
							</Button>
							<Button
								size="small"
								onClick={onOpenMarkNewQueenModal}
								style={isAddingQueenMarker && pendingMarkerFamilyId !== null ? { background: '#2470ff', color: '#fff' } : undefined}
							>
								<T>{isAddingQueenMarker && pendingMarkerFamilyId !== null ? 'Click image to mark new queen' : 'Mark new queen'}</T>
							</Button>
						</div>
					</div>
					{editableQueenAnnotations.length === 0 && (
						<div style={{ fontSize: 13, color: '#415066' }}>
							<T>No queen markers on this frame yet.</T>
						</div>
					)}
					<div className={styles.queenMarkersGrid}>
						{editableQueenAnnotations.map((annotation) => {
							const isAiCandidate = annotation.source === 'ai' && annotation.status !== 'approved';
							const selectedFamilyId = Number(annotation.familyId);
							const selectedFamily = Number.isFinite(selectedFamilyId) && selectedFamilyId > 0
								? familyById.get(selectedFamilyId)
								: undefined;
							const selectableFamilies = (families || []).filter((family) => {
								const familyId = Number(family?.id);
								if (!Number.isFinite(familyId) || familyId <= 0) return false;
								if (Number.isFinite(selectedFamilyId) && selectedFamilyId > 0 && familyId === selectedFamilyId) return true;
								return !occupiedFamilyIds.has(familyId);
							});
							return (
								<div key={annotation.id} className={styles.queenMarkerCard}>
									<div className={styles.queenMarkerTopRow}>
										<div className={styles.queenFamilySelectWrap}>
											<span className={styles.queenFamilyColor}>
												{selectedFamily ? (
													<QueenColor year={selectedFamily.added || ''} color={selectedFamily.color} />
												) : (
													<span className={styles.queenFamilyColorPlaceholder} />
												)}
											</span>
											<select
												className={styles.queenFamilySelect}
												value={annotation.familyId ? String(annotation.familyId) : ''}
												onChange={(event) => void handleAssignFamily(annotation, String((event.target as HTMLSelectElement).value || ''))}
											>
												<option value="">Unassigned</option>
												{selectableFamilies.map((family) => (
													<option key={family.id} value={family.id}>
														{family.name || `#${family.id}`}
													</option>
												))}
											</select>
										</div>
										<Button size="small" color="red" onClick={async () => { await removeQueenAnnotation(annotation); }}>
											<T>Delete</T>
										</Button>
									</div>
									{isAiCandidate && (
										<div className={styles.queenMarkerActionsRow}>
											<Button
												size="small"
												onClick={() => void upsertQueenAnnotation(annotation.id, (current) => ({
													...current,
													status: 'approved',
													updatedAt: new Date().toISOString(),
												}))}
											>
												<T>Approve</T>
											</Button>
											<Button
												size="small"
												color="gray"
												onClick={async () => {
													if (annotation.source === 'ai' && onRemoveDetectedQueenCandidate) {
														await onRemoveDetectedQueenCandidate({ x: annotation.x, y: annotation.y });
													}
													await removeQueenAnnotation(annotation);
												}}
											>
												<T>Reject</T>
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{isCreateQueenModalOpen && (
				<Modal title={<T>New queen</T>} onClose={() => setIsCreateQueenModalOpen(false)}>
					<div className={styles.createQueenModalContent}>
						<div className={styles.createQueenNameRow}>
							<div style={{ flex: 1 }}>
								<label className={inputStyles.label}><T>Queen Name</T></label>
								<input
									className={inputStyles.input}
									type="text"
									value={newQueenName}
									onChange={(event) => setNewQueenName(String((event.target as HTMLInputElement).value || ''))}
									placeholder="Enter queen name"
									autoFocus
								/>
							</div>
							<Button
								type="button"
								onClick={onRefreshQueenName}
								disabled={randomNameLoading}
								style={{
									height: '40px',
									minWidth: '40px',
									padding: '0 12px',
									margin: '24px 0 0',
								}}
								title="Get new name suggestion"
							>
								<RefreshIcon />
							</Button>
						</div>
						<div>
							<label className={inputStyles.label}><T>Race</T></label>
							<input
								className={inputStyles.input}
								type="text"
								value={newQueenRace}
								onChange={(event) => setNewQueenRace(String((event.target as HTMLInputElement).value || ''))}
								placeholder="e.g. Carniolan, Italian, etc."
							/>
						</div>
						<div>
							<label className={inputStyles.label}><T>Year</T></label>
							<div className={styles.createQueenYearRow}>
								<input
									className={inputStyles.input}
									type="text"
									value={newQueenYear}
									maxLength={4}
									onChange={(event) => {
										setNewQueenYear(String((event.target as HTMLInputElement).value || ''));
										setNewQueenColor(null);
									}}
									placeholder="YYYY"
								/>
								<div className={styles.createQueenColorPickerWrapper}>
									<QueenColorPicker
										year={newQueenYear}
										color={newQueenColor}
										onColorChange={(value: string) => setNewQueenColor(value)}
									/>
								</div>
							</div>
						</div>
						<div className={styles.createQueenModalButtons}>
							<Button size="small" color="gray" onClick={() => setIsCreateQueenModalOpen(false)}>
								<T>Cancel</T>
							</Button>
							<Button size="small" color="green" onClick={() => void onConfirmCreateQueen()} loading={isCreatingQueen}>
								<T>Create and mark</T>
							</Button>
						</div>
					</div>
				</Modal>
			)}

			<canvas ref={ref} id="container" style={{ width: '100%', display: 'block', touchAction: 'none' }}>
				<T>Canvas not supported.</T>
			</canvas>

		</div>
	);
}
