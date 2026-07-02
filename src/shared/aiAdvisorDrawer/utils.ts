import { isBillingTierAtLeast } from '@/shared/billingTier'
import type { FrameRouteContext } from './types'

export function canUseAIAdvisor(plan?: string | null) {
	return isBillingTierAtLeast(plan, 'starter')
}

export function buildId(prefix: string) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeDegrees(value: number) {
	const out = value % 360
	return out < 0 ? out + 360 : out
}

export function angularDelta(a: number, b: number) {
	const delta = Math.abs(normalizeDegrees(a) - normalizeDegrees(b))
	return Math.min(delta, 360 - delta)
}

export function distance2d(x1: number, y1: number, x2: number, y2: number) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

export function truncateText(value: any, max = 500) {
	if (typeof value !== 'string') return value
	return value.length > max ? `${value.slice(0, max)}...` : value
}

export function compactCellSummary(cells: any) {
	if (!cells || typeof cells !== 'object') return null
	return {
		broodPercent: cells.broodPercent ?? 0,
		cappedBroodPercent: cells.cappedBroodPercent ?? 0,
		eggsPercent: cells.eggsPercent ?? 0,
		nectarPercent: cells.nectarPercent ?? 0,
		honeyPercent: cells.honeyPercent ?? 0,
		pollenPercent: cells.pollenPercent ?? 0,
		droneBroodPercent: cells.droneBroodPercent ?? 0,
	}
}
export function compactEntity(value: any, allowedKeys: string[]) {
	if (!value || typeof value !== 'object') return value || null
	return allowedKeys.reduce((out: Record<string, any>, key) => {
		if (value[key] !== undefined) out[key] = value[key]
		return out
	}, {})
}

export function buildInspectionSummaries(inspections: any[], limit = 10) {
	if (!Array.isArray(inspections)) return []

	return inspections.slice(0, limit).map((inspection) => {
		let summary: Record<string, any> = {}
		try {
			const parsed =
				typeof inspection?.data === 'string'
					? JSON.parse(inspection.data)
					: inspection?.data
			if (parsed?.hive) {
				summary.hiveStatus = parsed.hive.status
				summary.beeCount = parsed.hive.beeCount
				summary.boxCount = parsed.hive.boxCount
			}
			if (parsed?.family) {
				summary.familyName = parsed.family.name
				summary.queenRace = parsed.family.race
			}
			if (parsed?.cellStats) {
				summary.cellStats = compactCellSummary(parsed.cellStats)
			}
		} catch (_) {
			// WHY: inspection.data is historical JSON and may be malformed. Keep a small text fallback instead of sending the full snapshot.
			summary.rawPreview = truncateText(inspection?.data, 200)
		}

		return {
			id: inspection?.id,
			hiveId: inspection?.hiveId,
			added: inspection?.added,
			...summary,
		}
	})
}

function sampleEvenly(values: any[], maxPoints: number) {
	if (!Array.isArray(values)) return []
	if (values.length <= maxPoints) return values
	const step = (values.length - 1) / (maxPoints - 1)
	return Array.from({ length: maxPoints }, (_, index) => {
		return values[Math.round(index * step)]
	})
}

export function buildCompactMetricSeries(metricResult: any, maxPoints = 48) {
	const metrics = Array.isArray(metricResult?.metrics) ? metricResult.metrics : []
	const sample = sampleEvenly(metrics, maxPoints)
	const numericValues = metrics
		.map((entry) => Number(entry?.v ?? entry?.netFlow ?? entry?.beesIn ?? 0))
		.filter((value) => Number.isFinite(value))

	return {
		points: metrics.length,
		latest: metrics[metrics.length - 1] || null,
		min: numericValues.length ? Math.min(...numericValues) : null,
		max: numericValues.length ? Math.max(...numericValues) : null,
		sample,
	}
}

export function pickOptimizedImage(file?: any) {
	if (!file) return null
	const resizes = Array.isArray(file?.resizes) ? [...file.resizes] : []
	if (!resizes.length) {
		return {
			url: file?.url || null,
			maxDimensionPx: null,
			source: file?.url ? 'original' : null,
		}
	}

	resizes.sort(
		(a, b) => (a?.max_dimension_px || 0) - (b?.max_dimension_px || 0)
	)
	const preferred =
		resizes.find((resize) => (resize?.max_dimension_px || 0) >= 512) ||
		resizes[resizes.length - 1]
	return {
		url: preferred?.url || file?.url || null,
		maxDimensionPx: preferred?.max_dimension_px || null,
		source: preferred?.url ? 'resize' : 'original',
	}
}

export function pruneForPreview(value: any, depth = 0): any {
	if (value === null || value === undefined) return value
	if (depth > 4) return '[truncated]'
	if (typeof value === 'string') return value.slice(0, 200)
	if (typeof value === 'number' || typeof value === 'boolean') return value

	if (Array.isArray(value)) {
		return value.slice(0, 5).map((entry) => pruneForPreview(entry, depth + 1))
	}

	if (typeof value === 'object') {
		const keys = Object.keys(value).slice(0, 12)
		const out = {}
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			out[key] = pruneForPreview(value[key], depth + 1)
		}
		return out
	}

	return String(value)
}

export function findSelectedFramePayload(
	framesByBox: Record<string, any>,
	frameRouteContext: FrameRouteContext | null
) {
	if (!frameRouteContext) return null

	const framesInBox = Object.values(
		framesByBox[String(frameRouteContext.boxId)] || {}
	)
	const selectedFrame = framesInBox.find(
		(frame: any) => +frame?.id === frameRouteContext.frameId
	)

	if (!selectedFrame) return null

	return pruneForPreview(selectedFrame)
}

export function findSelectedFrameRaw(
	framesByBox: Record<string, any>,
	frameRouteContext: FrameRouteContext | null
) {
	if (!frameRouteContext) return null
	const framesInBox = Object.values(
		framesByBox[String(frameRouteContext.boxId)] || {}
	)
	return (
		framesInBox.find(
			(frame: any) => +frame?.id === frameRouteContext.frameId
		) || null
	)
}

export function formatShortcutHintKeys(keys: string) {
	if (keys === 'Arrow keys') return '← ↑ → ↓'

	return keys
		.replace(/Arrow Left/g, '←')
		.replace(/Arrow Right/g, '→')
		.replace(/Arrow Up/g, '↑')
		.replace(/Arrow Down/g, '↓')
}
