import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { QueenAnnotation } from '@/models/frameSideFile';
import {
	CELL_SHORTCUTS,
	DEFAULT_QUEEN_MARKER_RADIUS_RATIO,
	MAX_QUEEN_MARKER_RADIUS_RATIO,
	MAX_ZOOM,
	MIN_QUEEN_MARKER_RADIUS_RATIO,
	MIN_ZOOM,
	QUEEN_MARKER_RADIUS_MULTIPLIER,
} from './constants';
import {
	clamp01,
	clampCameraOffset,
	debounce,
	getCanvasRelativePosition,
	getNormalizedPosition,
	getPressure,
	initCanvasSize,
	type CanvasCameraState,
} from './canvasGeometry';
import { findQueenMoveHit, findQueenResizeHandleHit } from './drawQueens';
import { drawStrokeSegment } from './drawStrokes';
import type {
	ActiveCanvasTool,
	BrushCellType,
	CanvasControlTab,
	CanvasCursorPoint,
	DrawingLine,
	DrawingPoint,
} from './types';

type UseCanvasInteractionsParams = {
	cameraRef: React.MutableRefObject<CanvasCameraState>;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	image: HTMLImageElement | null;
	canvasUrl: string;
	setCanvasUrl: (url: string) => void;
	getCanvasUrlForZoom: (zoom: number) => string;
	allowDrawing: boolean;
	activeControlTab: CanvasControlTab;
	activeTool: ActiveCanvasTool;
	strokeHistory: DrawingLine[];
	onStrokeHistoryUpdate: (history: DrawingLine[] | undefined) => void | Promise<void>;
	redrawCurrentCanvas: () => void;
	canCellBrush: boolean;
	canStrokeDraw: boolean;
	selectedCellType: BrushCellType;
	brushRadiusRatio: number;
	setActiveControlTab: (tab: CanvasControlTab) => void;
	setSelectedCellType: React.Dispatch<React.SetStateAction<BrushCellType>>;
	increaseBrushPreset: () => void;
	decreaseBrushPreset: () => void;
	undoDraw: () => void;
	editableDetectedCellsRef: React.MutableRefObject<any[]>;
	brushCursorRef: React.MutableRefObject<CanvasCursorPoint | null>;
	lastBrushCenterRef: React.MutableRefObject<CanvasCursorPoint | null>;
	applyBrushAtPoint: (params: {
		canvas: HTMLCanvasElement;
		center: CanvasCursorPoint;
		scheduleRedraw: () => void;
	}) => void;
	clearBrushInteractionState: () => void;
	queenAnnotationsOnCanvas: QueenAnnotation[];
	editableQueenAnnotationsRef: React.MutableRefObject<QueenAnnotation[]>;
	setEditableQueenAnnotations: React.Dispatch<React.SetStateAction<QueenAnnotation[]>>;
	isAddingQueenMarker: boolean;
	addQueenMarkerAtPosition: (point: CanvasCursorPoint) => Promise<void>;
	queenResizeStateRef: React.MutableRefObject<{ annotationId: string; hasChanged: boolean } | null>;
	queenMoveStateRef: React.MutableRefObject<{
		annotationId: string;
		hasChanged: boolean;
		offsetX: number;
		offsetY: number;
	} | null>;
	hoveredQueenResizeId: string | null;
	setHoveredQueenResizeId: (id: string | null) => void;
	hoveredQueenMoveId: string | null;
	setHoveredQueenMoveId: (id: string | null) => void;
	isQueenMarkerResizing: boolean;
	setIsQueenMarkerResizing: (value: boolean) => void;
	isQueenMarkerMoving: boolean;
	setIsQueenMarkerMoving: (value: boolean) => void;
	commitTransientAnnotationChange: (annotationId: string) => Promise<void>;
	resetMarkerInteractionState: () => void;
};

export function useCanvasInteractions({
	cameraRef,
	canvasRef,
	image,
	canvasUrl,
	setCanvasUrl,
	getCanvasUrlForZoom,
	allowDrawing,
	activeControlTab,
	activeTool,
	strokeHistory,
	onStrokeHistoryUpdate,
	redrawCurrentCanvas,
	canCellBrush,
	canStrokeDraw,
	selectedCellType,
	brushRadiusRatio,
	setActiveControlTab,
	setSelectedCellType,
	increaseBrushPreset,
	decreaseBrushPreset,
	undoDraw,
	brushCursorRef,
	lastBrushCenterRef,
	applyBrushAtPoint,
	clearBrushInteractionState,
	queenAnnotationsOnCanvas,
	editableQueenAnnotationsRef,
	setEditableQueenAnnotations,
	isAddingQueenMarker,
	addQueenMarkerAtPosition,
	queenResizeStateRef,
	queenMoveStateRef,
	hoveredQueenResizeId,
	setHoveredQueenResizeId,
	hoveredQueenMoveId,
	setHoveredQueenMoveId,
	isQueenMarkerResizing,
	setIsQueenMarkerResizing,
	isQueenMarkerMoving,
	setIsQueenMarkerMoving,
	commitTransientAnnotationChange,
	resetMarkerInteractionState,
}: UseCanvasInteractionsParams) {
	const redrawRafRef = useRef<number | null>(null);
	const isPointerDownRef = useRef(false);
	const isPanningRef = useRef(false);
	const startPanPositionRef = useRef({ x: 0, y: 0 });
	const initialPanOffsetRef = useRef({ x: 0, y: 0 });
	const pointsRef = useRef<DrawingPoint[]>([]);
	const currentLineWidthRef = useRef(0);
	const [zoomEnabled, setZoomEnabled] = useState(false);

	const scheduleRedraw = useCallback(() => {
		if (redrawRafRef.current !== null) return;
		redrawRafRef.current = window.requestAnimationFrame(() => {
			redrawRafRef.current = null;
			redrawCurrentCanvas();
		});
	}, [redrawCurrentCanvas]);

	const resetStrokeDraft = useCallback(() => {
		pointsRef.current = [];
		currentLineWidthRef.current = 0;
	}, []);

	const getDefaultCanvasCursor = useCallback(() => {
		if (!allowDrawing) return 'default';
		if (isAddingQueenMarker) return 'pointer';
		if (activeControlTab === 'free-draw') return 'crosshair';
		if (activeControlTab === 'frame-cells') return 'all-scroll';
		return 'default';
	}, [allowDrawing, activeControlTab, isAddingQueenMarker]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || isPanningRef.current) return;
		const isQueenResizeCursor =
			activeControlTab === 'queens' &&
			(isQueenMarkerResizing || Boolean(hoveredQueenResizeId));
		const isQueenMoveCursor =
			activeControlTab === 'queens' &&
			(isQueenMarkerMoving || Boolean(hoveredQueenMoveId));
		if (isQueenResizeCursor) {
			canvas.style.cursor = 'nwse-resize';
		} else if (isQueenMarkerMoving) {
			canvas.style.cursor = 'grabbing';
		} else if (isQueenMoveCursor) {
			canvas.style.cursor = 'grab';
		} else {
			canvas.style.cursor = getDefaultCanvasCursor();
		}
	}, [
		canvasRef,
		activeControlTab,
		hoveredQueenResizeId,
		hoveredQueenMoveId,
		isQueenMarkerResizing,
		isQueenMarkerMoving,
		getDefaultCanvasCursor,
	]);

	useEffect(() => {
		if (activeControlTab === 'queens' && !isAddingQueenMarker) return;
		resetMarkerInteractionState();
	}, [activeControlTab, isAddingQueenMarker, resetMarkerInteractionState]);

	useEffect(() => {
		cameraRef.current = { zoom: 1, offset: { x: 0, y: 0 } };
		isPanningRef.current = false;
		isPointerDownRef.current = false;
		resetStrokeDraft();
		clearBrushInteractionState();
		resetMarkerInteractionState();
		}, [clearBrushInteractionState, resetMarkerInteractionState, resetStrokeDraft]);

	useEffect(() => {
		return () => {
			if (redrawRafRef.current !== null) {
				window.cancelAnimationFrame(redrawRafRef.current);
				redrawRafRef.current = null;
			}
		};
	}, []);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !image) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { zoomEnabled: nextZoomEnabled } = initCanvasSize(canvas, ctx, image);
		setZoomEnabled(nextZoomEnabled);
		redrawCurrentCanvas();
	}, [canvasRef, image, redrawCurrentCanvas]);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !image) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const handleResize = debounce(() => {
			const { zoomEnabled: nextZoomEnabled } = initCanvasSize(canvas, ctx, image);
			setZoomEnabled(nextZoomEnabled);
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
	}, [canvasRef, image, redrawCurrentCanvas]);

	useLayoutEffect(() => {
		if (!allowDrawing) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const updateBrushCursor = (e: MouseEvent | TouchEvent) => {
			if (!canCellBrush || activeTool !== 'cell-brush') return;
			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
			brushCursorRef.current = {
				x: clamp01(normalizedPos.x),
				y: clamp01(normalizedPos.y),
			};
			scheduleRedraw();
		};

		const updateQueenResizeHover = (e: MouseEvent | TouchEvent) => {
			if (!(e instanceof MouseEvent)) return;
			if (isQueenMarkerResizing) {
				canvas.style.cursor = 'nwse-resize';
				return;
			}
			if (isQueenMarkerMoving) {
				canvas.style.cursor = 'grabbing';
				return;
			}
			if (activeControlTab !== 'queens' || isAddingQueenMarker) {
				if (hoveredQueenResizeId !== null) {
					setHoveredQueenResizeId(null);
				}
				if (hoveredQueenMoveId !== null) {
					setHoveredQueenMoveId(null);
				}
				canvas.style.cursor = getDefaultCanvasCursor();
				return;
			}

			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
			const resizeHit = findQueenResizeHandleHit(queenAnnotationsOnCanvas, canvas, normalizedPos);
			const moveHit = resizeHit ? null : findQueenMoveHit(queenAnnotationsOnCanvas, canvas, normalizedPos);
			const nextHoveredResizeId = resizeHit?.annotationId || null;
			const nextHoveredMoveId = moveHit?.annotationId || null;
			if (nextHoveredResizeId !== hoveredQueenResizeId) {
				setHoveredQueenResizeId(nextHoveredResizeId);
			}
			if (nextHoveredMoveId !== hoveredQueenMoveId) {
				setHoveredQueenMoveId(nextHoveredMoveId);
			}
			canvas.style.cursor = nextHoveredResizeId
				? 'nwse-resize'
				: nextHoveredMoveId
					? 'grab'
					: getDefaultCanvasCursor();
		};

		const handleDrawStart = (e: MouseEvent | TouchEvent) => {
			if (isPanningRef.current || (e instanceof MouseEvent && e.button !== 0)) return;
			e.preventDefault();

			if (!isAddingQueenMarker && activeControlTab === 'queens' && e instanceof MouseEvent) {
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
				const resizeHit = findQueenResizeHandleHit(queenAnnotationsOnCanvas, canvas, normalizedPos);
				if (resizeHit) {
					queenResizeStateRef.current = {
						annotationId: resizeHit.annotationId,
						hasChanged: false,
					};
					queenMoveStateRef.current = null;
					isPointerDownRef.current = true;
					setIsQueenMarkerResizing(true);
					setIsQueenMarkerMoving(false);
					setHoveredQueenResizeId(resizeHit.annotationId);
					setHoveredQueenMoveId(null);
					canvas.style.cursor = 'nwse-resize';
					return;
				}
				const moveHit = findQueenMoveHit(queenAnnotationsOnCanvas, canvas, normalizedPos);
				if (moveHit) {
					const movingAnnotation = editableQueenAnnotationsRef.current.find((item) => item.id === moveHit.annotationId);
					if (movingAnnotation) {
						const markerX = Number(movingAnnotation.x);
						const markerY = Number(movingAnnotation.y);
						queenMoveStateRef.current = {
							annotationId: moveHit.annotationId,
							hasChanged: false,
							offsetX: clamp01(normalizedPos.x) - markerX,
							offsetY: clamp01(normalizedPos.y) - markerY,
						};
						queenResizeStateRef.current = null;
						isPointerDownRef.current = true;
						setIsQueenMarkerMoving(true);
						setIsQueenMarkerResizing(false);
						setHoveredQueenMoveId(moveHit.annotationId);
						setHoveredQueenResizeId(null);
						canvas.style.cursor = 'grabbing';
						return;
					}
				}
			}

			if (isAddingQueenMarker) {
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
				void addQueenMarkerAtPosition({
					x: clamp01(normalizedPos.x),
					y: clamp01(normalizedPos.y),
				});
				return;
			}

			if (!canCellBrush && !canStrokeDraw) return;

			if (canCellBrush && activeTool === 'cell-brush') {
				isPointerDownRef.current = true;
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
				applyBrushAtPoint({
					canvas,
					center: { x: normalizedPos.x, y: normalizedPos.y },
					scheduleRedraw,
				});
				return;
			}
			if (!canStrokeDraw) return;

			isPointerDownRef.current = true;
			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
			const pressure = getPressure(e);
			const newLineWidth = (Math.log(pressure + 1) * 10) / canvas.width;

			pointsRef.current = [{ ...normalizedPos, lineWidth: newLineWidth }];
			currentLineWidthRef.current = newLineWidth;

			ctx.save();
			ctx.setTransform(
				cameraRef.current.zoom,
				0,
				0,
				cameraRef.current.zoom,
				cameraRef.current.offset.x,
				cameraRef.current.offset.y,
			);
			drawStrokeSegment(canvas, ctx, pointsRef.current);
			ctx.restore();
		};

		const handleDrawMove = (e: MouseEvent | TouchEvent) => {
			updateBrushCursor(e);
			updateQueenResizeHover(e);
			const queenMoveState = queenMoveStateRef.current;
			if (isPointerDownRef.current && queenMoveState && !isPanningRef.current) {
				e.preventDefault();
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
				const pointerX = clamp01(normalizedPos.x);
				const pointerY = clamp01(normalizedPos.y);
				const activeAnnotation = editableQueenAnnotationsRef.current.find((item) => item.id === queenMoveState.annotationId);
				if (!activeAnnotation) {
					queenMoveStateRef.current = null;
					setIsQueenMarkerMoving(false);
					canvas.style.cursor = getDefaultCanvasCursor();
					return;
				}
				const nextX = clamp01(pointerX - queenMoveState.offsetX);
				const nextY = clamp01(pointerY - queenMoveState.offsetY);
				const currentX = Number(activeAnnotation.x);
				const currentY = Number(activeAnnotation.y);
				if (Math.abs(nextX - currentX) > 0.0001 || Math.abs(nextY - currentY) > 0.0001) {
					queenMoveStateRef.current = {
						...queenMoveState,
						hasChanged: true,
					};
					setEditableQueenAnnotations((previous) => {
						const next = previous.map((annotation) => (
							annotation.id === queenMoveState.annotationId
								? { ...annotation, x: nextX, y: nextY }
								: annotation
						));
						editableQueenAnnotationsRef.current = next;
						return next;
					});
					scheduleRedraw();
				}
				return;
			}
			const queenResizeState = queenResizeStateRef.current;
			if (isPointerDownRef.current && queenResizeState && !isPanningRef.current) {
				e.preventDefault();
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
				const nextCursor = {
					x: clamp01(normalizedPos.x),
					y: clamp01(normalizedPos.y),
				};
				const activeAnnotation = editableQueenAnnotationsRef.current.find((item) => item.id === queenResizeState.annotationId);
				if (!activeAnnotation) {
					queenResizeStateRef.current = null;
					setIsQueenMarkerResizing(false);
					canvas.style.cursor = getDefaultCanvasCursor();
					return;
				}

				const centerX = Number(activeAnnotation.x) * canvas.width;
				const centerY = Number(activeAnnotation.y) * canvas.height;
				const pointerX = nextCursor.x * canvas.width;
				const pointerY = nextCursor.y * canvas.height;
				const distancePx = Math.hypot(pointerX - centerX, pointerY - centerY);
				const nextRadius = Math.max(
					MIN_QUEEN_MARKER_RADIUS_RATIO,
					Math.min(MAX_QUEEN_MARKER_RADIUS_RATIO, distancePx / (canvas.width * QUEEN_MARKER_RADIUS_MULTIPLIER))
				);
				const currentRadius = Number(activeAnnotation.radius) || DEFAULT_QUEEN_MARKER_RADIUS_RATIO;
				if (Math.abs(nextRadius - currentRadius) > 0.0001) {
					queenResizeStateRef.current = {
						...queenResizeState,
						hasChanged: true,
					};
					setEditableQueenAnnotations((previous) => {
						const next = previous.map((annotation) => (
							annotation.id === queenResizeState.annotationId
								? { ...annotation, radius: nextRadius }
								: annotation
						));
						editableQueenAnnotationsRef.current = next;
						return next;
					});
					scheduleRedraw();
				}
				return;
			}
			if (!isPointerDownRef.current || isPanningRef.current) return;
			if (!canCellBrush && !canStrokeDraw) return;
			e.preventDefault();

			if (canCellBrush && activeTool === 'cell-brush') {
				const pos = getCanvasRelativePosition(canvas, e);
				const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
				applyBrushAtPoint({
					canvas,
					center: { x: normalizedPos.x, y: normalizedPos.y },
					scheduleRedraw,
				});
				return;
			}
			if (!canStrokeDraw) return;

			const pos = getCanvasRelativePosition(canvas, e);
			const normalizedPos = getNormalizedPosition(canvas, pos, cameraRef.current);
			const pressure = getPressure(e);
			const targetWidth = (Math.log(pressure + 1) * 40) / canvas.width;
			const newLineWidth = targetWidth * 0.2 + currentLineWidthRef.current * 0.8;

			pointsRef.current.push({ ...normalizedPos, lineWidth: newLineWidth });
			currentLineWidthRef.current = newLineWidth;

			ctx.save();
			ctx.setTransform(
				cameraRef.current.zoom,
				0,
				0,
				cameraRef.current.zoom,
				cameraRef.current.offset.x,
				cameraRef.current.offset.y,
			);
			drawStrokeSegment(canvas, ctx, pointsRef.current);
			ctx.restore();
		};

		const handleDrawEnd = async (e: MouseEvent | TouchEvent) => {
			if (!isPointerDownRef.current || isPanningRef.current || (e instanceof MouseEvent && e.button !== 0)) return;

			isPointerDownRef.current = false;
			const queenMoveState = queenMoveStateRef.current;
			if (queenMoveState) {
				queenMoveStateRef.current = null;
				setIsQueenMarkerMoving(false);
				if (queenMoveState.hasChanged) {
					await commitTransientAnnotationChange(queenMoveState.annotationId);
				}
				canvas.style.cursor = getDefaultCanvasCursor();
				return;
			}
			const queenResizeState = queenResizeStateRef.current;
			if (queenResizeState) {
				queenResizeStateRef.current = null;
				setIsQueenMarkerResizing(false);
				if (queenResizeState.hasChanged) {
					await commitTransientAnnotationChange(queenResizeState.annotationId);
				}
				canvas.style.cursor = getDefaultCanvasCursor();
				return;
			}
			if (canCellBrush && activeTool === 'cell-brush') {
				lastBrushCenterRef.current = null;
				return;
			}
			if (!canStrokeDraw) {
				lastBrushCenterRef.current = null;
				return;
			}

			if (pointsRef.current.length > 0) {
				let newHistory: DrawingLine[] = [[...pointsRef.current]];
				if (strokeHistory && strokeHistory.length > 0) {
					newHistory = [...strokeHistory, ...newHistory];
				}
				await onStrokeHistoryUpdate(newHistory);
			}
			currentLineWidthRef.current = 0;
		};

		const handleDrawLeave = async (e: MouseEvent | TouchEvent) => {
			brushCursorRef.current = null;
			lastBrushCenterRef.current = null;
			setHoveredQueenResizeId(null);
			setHoveredQueenMoveId(null);
			scheduleRedraw();
			await handleDrawEnd(e);
		};

		canvas.addEventListener('mousedown', handleDrawStart);
		canvas.addEventListener('touchstart', handleDrawStart, { passive: false });
		canvas.addEventListener('mousemove', handleDrawMove);
		canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
		canvas.addEventListener('mouseup', handleDrawEnd);
		canvas.addEventListener('mouseleave', handleDrawLeave);
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
	}, [
		allowDrawing,
		activeControlTab,
		activeTool,
		addQueenMarkerAtPosition,
		applyBrushAtPoint,
		brushCursorRef,
		canCellBrush,
		canStrokeDraw,
		commitTransientAnnotationChange,
		getDefaultCanvasCursor,
		hoveredQueenMoveId,
		hoveredQueenResizeId,
		isAddingQueenMarker,
		isQueenMarkerMoving,
		isQueenMarkerResizing,
		lastBrushCenterRef,
		onStrokeHistoryUpdate,
		queenAnnotationsOnCanvas,
		queenMoveStateRef,
		queenResizeStateRef,
		scheduleRedraw,
		selectedCellType,
		setEditableQueenAnnotations,
		setHoveredQueenMoveId,
		setHoveredQueenResizeId,
		setIsQueenMarkerMoving,
		setIsQueenMarkerResizing,
		strokeHistory,
	]);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !zoomEnabled) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const getIdleCursor = () => (
			activeControlTab === 'queens' && (isQueenMarkerResizing || Boolean(hoveredQueenResizeId))
				? 'nwse-resize'
				: activeControlTab === 'queens' && isQueenMarkerMoving
					? 'grabbing'
					: activeControlTab === 'queens' && Boolean(hoveredQueenMoveId)
						? 'grab'
						: getDefaultCanvasCursor()
		);

		const handleScroll = (event: WheelEvent) => {
			if (isPointerDownRef.current) return;
			event.preventDefault();

			const mousePos = getCanvasRelativePosition(canvas, event as unknown as MouseEvent);
			const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cameraRef.current.zoom * zoomFactor));
			if (newZoom === cameraRef.current.zoom) return;

			const nextCanvasUrl = getCanvasUrlForZoom(newZoom);
			if (nextCanvasUrl && nextCanvasUrl !== canvasUrl) {
				setCanvasUrl(nextCanvasUrl);
			}

			const mouseXInWorldBeforeZoom = (mousePos.x - cameraRef.current.offset.x) / cameraRef.current.zoom;
			const mouseYInWorldBeforeZoom = (mousePos.y - cameraRef.current.offset.y) / cameraRef.current.zoom;

			cameraRef.current.zoom = newZoom;
			if (cameraRef.current.zoom === 1) {
				cameraRef.current.offset = { x: 0, y: 0 };
			}

			// WHY: keep the pixel under the cursor fixed while zooming.
			// WHAT: recompute camera offset from world coordinates so the image does not slip away.
			cameraRef.current.offset.x = mousePos.x - mouseXInWorldBeforeZoom * cameraRef.current.zoom;
			cameraRef.current.offset.y = mousePos.y - mouseYInWorldBeforeZoom * cameraRef.current.zoom;
			clampCameraOffset(canvas, cameraRef.current);

			ctx.setTransform(
				cameraRef.current.zoom,
				0,
				0,
				cameraRef.current.zoom,
				cameraRef.current.offset.x,
				cameraRef.current.offset.y,
			);
			redrawCurrentCanvas();
		};

		const handlePanEnd = () => {
			if (isPanningRef.current) {
				isPanningRef.current = false;
				canvas.style.cursor = getIdleCursor();
			}
		};

		const handlePanStart = (e: MouseEvent | TouchEvent) => {
			const isRightClick = e instanceof MouseEvent && e.button === 2;
			const isTwoFingerTouch = e instanceof TouchEvent && e.touches.length === 2;
			if (!isRightClick && !isTwoFingerTouch) return;

			e.preventDefault();
			isPanningRef.current = true;
			isPointerDownRef.current = false;
			canvas.style.cursor = 'grabbing';
			initialPanOffsetRef.current = { ...cameraRef.current.offset };

			if (isRightClick) {
				startPanPositionRef.current = { x: e.clientX, y: e.clientY };
			} else if (isTwoFingerTouch) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				startPanPositionRef.current = {
					x: (touch1.clientX + touch2.clientX) / 2,
					y: (touch1.clientY + touch2.clientY) / 2,
				};
			}
		};

		const handlePanMove = (e: MouseEvent | TouchEvent) => {
			if (!isPanningRef.current) return;
			e.preventDefault();

			let currentX: number;
			let currentY: number;
			if (e instanceof MouseEvent) {
				currentX = e.clientX;
				currentY = e.clientY;
			} else if (e instanceof TouchEvent && e.touches.length === 2) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				currentX = (touch1.clientX + touch2.clientX) / 2;
				currentY = (touch1.clientY + touch2.clientY) / 2;
			} else {
				handlePanEnd();
				return;
			}

			const totalDx = currentX - startPanPositionRef.current.x;
			const totalDy = currentY - startPanPositionRef.current.y;

			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;

			cameraRef.current.offset.x = initialPanOffsetRef.current.x + (totalDx * scaleX);
			cameraRef.current.offset.y = initialPanOffsetRef.current.y + (totalDy * scaleY);
			clampCameraOffset(canvas, cameraRef.current);

			ctx.setTransform(
				cameraRef.current.zoom,
				0,
				0,
				cameraRef.current.zoom,
				cameraRef.current.offset.x,
				cameraRef.current.offset.y,
			);
			redrawCurrentCanvas();
		};

		const preventContextMenu = (e: Event) => e.preventDefault();

		canvas.addEventListener('wheel', handleScroll, { passive: false });
		canvas.addEventListener('contextmenu', preventContextMenu);
		canvas.addEventListener('mousedown', handlePanStart);
		canvas.addEventListener('touchstart', handlePanStart, { passive: false });
		window.addEventListener('mousemove', handlePanMove);
		window.addEventListener('touchmove', handlePanMove, { passive: false });
		window.addEventListener('mouseup', handlePanEnd);
		window.addEventListener('touchend', handlePanEnd);
		canvas.addEventListener('mouseleave', handlePanEnd);

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
	}, [
		canvasRef,
		canvasUrl,
		getCanvasUrlForZoom,
		getDefaultCanvasCursor,
		hoveredQueenMoveId,
		hoveredQueenResizeId,
		isQueenMarkerMoving,
		isQueenMarkerResizing,
		activeControlTab,
		redrawCurrentCanvas,
		setCanvasUrl,
		zoomEnabled,
	]);
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
	}, [allowDrawing, decreaseBrushPreset, increaseBrushPreset, setActiveControlTab, setSelectedCellType, undoDraw]);

	return {
		scheduleRedraw,
		resetStrokeDraft,
		zoomEnabled,
	};
}
