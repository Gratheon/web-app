import type { BrushCellType, BrushSizePreset, NonEraseBrushCellType } from './types';

export const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

export const DEFAULT_BRUSH_DIAMETER_RATIO = 0.15;
export const BRUSH_DIAMETER_BY_PRESET: Record<BrushSizePreset, number> = {
	small: DEFAULT_BRUSH_DIAMETER_RATIO * 0.6,
	medium: DEFAULT_BRUSH_DIAMETER_RATIO,
	large: DEFAULT_BRUSH_DIAMETER_RATIO * 1.4,
};

export const DEFAULT_NEW_CELL_RADIUS_RATIO = 0.006;
export const DEFAULT_QUEEN_MARKER_RADIUS_RATIO = 0.022;
export const MIN_QUEEN_MARKER_RADIUS_RATIO = 0.004;
export const MAX_QUEEN_MARKER_RADIUS_RATIO = 0.12;
export const QUEEN_MARKER_RADIUS_MULTIPLIER = 1.5;

export const CELL_SHORTCUTS: Record<string, NonEraseBrushCellType> = {
	n: 4,
	y: 2,
	p: 6,
	g: 1,
	b: 3,
	k: 0,
	d: 7,
	u: 5,
};

export const CELL_TYPE_HINTS: Record<NonEraseBrushCellType, string> = {
	4: 'Shift+N',
	2: 'Shift+Y',
	6: 'Shift+P',
	1: 'Shift+G',
	3: 'Shift+B',
	0: 'Shift+K',
	7: 'Shift+D',
	5: 'Shift+U',
};

export const CELL_TYPE_OPTIONS: Array<{ value: BrushCellType; label: string }> = [
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

export const CELLS_OPACITY_STORAGE_KEY = 'hiveEdit.cellsOpacityPercent';
export const DEFAULT_CELLS_OPACITY_PERCENT = 50;

export function normalizeCellsOpacityPercent(value: number) {
	if (!Number.isFinite(value)) return DEFAULT_CELLS_OPACITY_PERCENT;
	return Math.max(0, Math.min(100, Math.round(value)));
}

export function getStoredCellsOpacityPercent() {
	if (typeof window === 'undefined') return DEFAULT_CELLS_OPACITY_PERCENT;
	const rawValue = window.localStorage.getItem(CELLS_OPACITY_STORAGE_KEY);
	if (rawValue === null) return DEFAULT_CELLS_OPACITY_PERCENT;
	const parsedValue = Number(rawValue);
	return normalizeCellsOpacityPercent(parsedValue);
}

export const MAX_ZOOM = 100;
export const MIN_ZOOM = 1;
export const MED_ZOOM = 2;

export const layerToggleButtonStyle = {
	background: '#fff',
	color: '#111',
	border: '1px solid #d6d6d6',
} as const;
