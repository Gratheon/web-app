import type { QueenAnnotation } from '@/models/frameSideFile';
import {
	DEFAULT_QUEEN_MARKER_RADIUS_RATIO,
	QUEEN_MARKER_RADIUS_MULTIPLIER,
	dpr,
} from './constants';
import { calculateRelPx } from './drawShared';
import type { QueenMoveHit, QueenResizeHit } from './types';

export function getQueenMarkerRadiusPx(annotation: QueenAnnotation, canvas: HTMLCanvasElement): number {
	const radiusRatio = Number(annotation?.radius);
	const safeRadiusRatio = Number.isFinite(radiusRatio) && radiusRatio > 0
		? radiusRatio
		: DEFAULT_QUEEN_MARKER_RADIUS_RATIO;
	return safeRadiusRatio * canvas.width * QUEEN_MARKER_RADIUS_MULTIPLIER;
}

export function findQueenResizeHandleHit(
	queenAnnotations: QueenAnnotation[],
	canvas: HTMLCanvasElement,
	normalizedPos: { x: number; y: number }
): QueenResizeHit | null {
	if (!Array.isArray(queenAnnotations) || queenAnnotations.length === 0) {
		return null;
	}

	const pointX = normalizedPos.x * canvas.width;
	const pointY = normalizedPos.y * canvas.height;
	const handleTolerancePx = Math.max(8, 10 * dpr);
	let bestHit: { id: string; edgeDistance: number } | null = null;

	for (const annotation of queenAnnotations) {
		if (!annotation?.id) continue;
		if (annotation?.source === 'ai' && annotation?.status !== 'approved') continue;
		const centerX = Number(annotation?.x) * canvas.width;
		const centerY = Number(annotation?.y) * canvas.height;
		if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) continue;

		const radiusPx = getQueenMarkerRadiusPx(annotation, canvas);
		const distanceToCenter = Math.hypot(pointX - centerX, pointY - centerY);
		const edgeDistance = Math.abs(distanceToCenter - radiusPx);
		if (edgeDistance > handleTolerancePx) continue;

		if (!bestHit || edgeDistance < bestHit.edgeDistance) {
			bestHit = { id: annotation.id, edgeDistance };
		}
	}

	return bestHit ? { annotationId: bestHit.id } : null;
}

export function findQueenMoveHit(
	queenAnnotations: QueenAnnotation[],
	canvas: HTMLCanvasElement,
	normalizedPos: { x: number; y: number }
): QueenMoveHit | null {
	if (!Array.isArray(queenAnnotations) || queenAnnotations.length === 0) {
		return null;
	}

	const pointX = normalizedPos.x * canvas.width;
	const pointY = normalizedPos.y * canvas.height;
	const handleTolerancePx = Math.max(8, 10 * dpr);
	let bestHit: { id: string; centerDistance: number } | null = null;

	for (const annotation of queenAnnotations) {
		if (!annotation?.id) continue;
		if (annotation?.source === 'ai' && annotation?.status !== 'approved') continue;
		const centerX = Number(annotation?.x) * canvas.width;
		const centerY = Number(annotation?.y) * canvas.height;
		if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) continue;

		const radiusPx = getQueenMarkerRadiusPx(annotation, canvas);
		const centerDistance = Math.hypot(pointX - centerX, pointY - centerY);
		const innerRadius = Math.max(0, radiusPx - handleTolerancePx);
		if (centerDistance > innerRadius) continue;

		if (!bestHit || centerDistance < bestHit.centerDistance) {
			bestHit = { id: annotation.id, centerDistance };
		}
	}

	return bestHit ? { annotationId: bestHit.id } : null;
}

export function drawQueenAnnotations(
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
		if (!Number.isFinite(x) || !Number.isFinite(y)) return;

		const radius = getQueenMarkerRadiusPx(annotation, canvas);
		const isApproved = annotation?.status === 'approved';
		const isAiCandidate = annotation?.source === 'ai' && !isApproved;
		ctx.save();
		ctx.globalAlpha = isApproved ? 0.85 : 0.65;
		ctx.beginPath();
		ctx.arc(x * canvas.width, y * canvas.height, radius, 0, 2 * Math.PI);
		if (!isAiCandidate) {
			ctx.fillStyle = isApproved ? 'rgba(36, 112, 255, 0.18)' : 'rgba(36, 112, 255, 0.08)';
			ctx.fill();
		}
		// WHY: canvas backing store is DPR-scaled, so 1 logical px becomes visually too thin.
		// Keep outlines at a CSS-like thickness so queen markers remain readable after zoom-resize churn.
		const blueStrokeWidth = Math.min(5 * dpr, Math.max(3 * dpr, 3 * relPx));
		if (isAiCandidate) {
			const candidateBlueStrokeWidth = Math.min(8 * dpr, Math.max(6 * dpr, 5 * relPx));
			const candidateWhiteStrokeWidth = candidateBlueStrokeWidth + Math.max(4 * dpr, 3 * relPx);
			const candidateDotLength = Math.max(0.5 * dpr, 0.4 * relPx);
			const candidateDotGap = Math.max(24 * dpr, 18 * relPx);
			const candidateDash = [candidateDotLength, candidateDotGap];
			ctx.setLineDash(candidateDash);
			ctx.lineCap = 'round';
			ctx.lineWidth = candidateWhiteStrokeWidth;
			ctx.strokeStyle = '#ffffff';
			ctx.stroke();
			ctx.lineWidth = candidateBlueStrokeWidth;
			ctx.strokeStyle = '#1f5eff';
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.lineCap = 'butt';
		} else {
			const whiteStrokeWidth = blueStrokeWidth + Math.max(2 * dpr, 1.8 * relPx);
			ctx.lineWidth = whiteStrokeWidth;
			ctx.strokeStyle = '#ffffff';
			ctx.stroke();
			ctx.lineWidth = blueStrokeWidth;
			ctx.strokeStyle = isApproved ? '#1f5eff' : '#6fa2ff';
			ctx.stroke();
		}
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

export function drawQueenPlacementPreview(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	brushCursor: { x: number; y: number },
	radiusRatio = DEFAULT_QUEEN_MARKER_RADIUS_RATIO
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
