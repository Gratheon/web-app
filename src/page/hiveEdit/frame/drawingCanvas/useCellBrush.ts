import { useCallback, useEffect, useRef, useState } from 'react';
import {
	BRUSH_DIAMETER_BY_PRESET,
	CELLS_OPACITY_STORAGE_KEY,
	DEFAULT_NEW_CELL_RADIUS_RATIO,
	getStoredCellsOpacityPercent,
	normalizeCellsOpacityPercent,
} from './constants';
import { clamp01 } from './canvasGeometry';
import type { BrushCellType, BrushSizePreset, CanvasCellEditState, CanvasCursorPoint } from './types';

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

type UseCellBrushParams = {
	detectedCells?: any[];
	onDetectedCellsUpdate?: (detectedCells: any[]) => void | Promise<void>;
	saveRequestId?: number;
	onCellEditsStateChange?: (state: CanvasCellEditState) => void;
};

export function useCellBrush({
	detectedCells = [],
	onDetectedCellsUpdate,
	saveRequestId = 0,
	onCellEditsStateChange = () => {},
}: UseCellBrushParams) {
	const [selectedCellType, setSelectedCellType] = useState<BrushCellType>(2);
	const [brushSizePreset, setBrushSizePreset] = useState<BrushSizePreset>('medium');
	const [cellsOpacityPercent, setCellsOpacityPercent] = useState(getStoredCellsOpacityPercent);
	const [hasUnsavedCellEdits, setHasUnsavedCellEdits] = useState(false);
	const [isSavingCellEdits, setIsSavingCellEdits] = useState(false);
	const editableDetectedCellsRef = useRef<any[]>(detectedCells || []);
	const brushCursorRef = useRef<CanvasCursorPoint | null>(null);
	const lastBrushCenterRef = useRef<CanvasCursorPoint | null>(null);
	const lastHandledSaveRequestIdRef = useRef(0);

	useEffect(() => {
		// WHY: incoming detections can refresh from persistence while the user is still brushing locally.
		// Keep the in-progress editable buffer authoritative until those edits are explicitly saved.
		if (hasUnsavedCellEdits) return;
		editableDetectedCellsRef.current = detectedCells || [];
	}, [detectedCells, hasUnsavedCellEdits]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(CELLS_OPACITY_STORAGE_KEY, String(cellsOpacityPercent));
	}, [cellsOpacityPercent]);

	const brushRadiusRatio = BRUSH_DIAMETER_BY_PRESET[brushSizePreset] / 2;

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

	const clearBrushInteractionState = useCallback(() => {
		brushCursorRef.current = null;
		lastBrushCenterRef.current = null;
	}, []);

	const applyBrushAtPoint = useCallback((params: {
		canvas: HTMLCanvasElement;
		center: CanvasCursorPoint;
		scheduleRedraw: () => void;
	}) => {
		const { canvas, center, scheduleRedraw } = params;
		const clampedCenter = { x: clamp01(center.x), y: clamp01(center.y) };
		const getMedianRadius = (cells: any[]): number => {
			const radii = cells
				.filter((cell) => Array.isArray(cell) && typeof cell[3] === 'number' && Number.isFinite(cell[3]) && cell[3] > 0)
				.map((cell) => cell[3] as number)
				.sort((a, b) => a - b);
			if (radii.length === 0) return DEFAULT_NEW_CELL_RADIUS_RATIO;
			return radii[Math.floor(radii.length / 2)];
		};

		const applyBrushAlongPath = (from: CanvasCursorPoint, to: CanvasCursorPoint) => {
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
				const point = {
					x: clamp01(from.x + dx * t),
					y: clamp01(from.y + dy * t),
				};
				const { cells: nextCells, changed } = applyCellBrush(
					workingCells,
					point,
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
	}, [brushRadiusRatio, hasUnsavedCellEdits, selectedCellType]);

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
		// WHY: parent save buttons signal with a monotonically increasing request id.
		// This avoids duplicate writes when React replays effects or re-renders the canvas tree.
		void onSaveCellEdits();
	}, [saveRequestId, onSaveCellEdits]);

	return {
		selectedCellType,
		setSelectedCellType,
		brushSizePreset,
		setBrushSizePreset,
		cellsOpacityPercent,
		setCellsOpacityPercent: (value: number) => setCellsOpacityPercent(normalizeCellsOpacityPercent(value)),
		brushRadiusRatio,
		increaseBrushPreset,
		decreaseBrushPreset,
		hasUnsavedCellEdits,
		isSavingCellEdits,
		editableDetectedCellsRef,
		brushCursorRef,
		lastBrushCenterRef,
		clearBrushInteractionState,
		applyBrushAtPoint,
		onSaveCellEdits,
	};
}
