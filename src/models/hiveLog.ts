import { db } from './db'
import { gatewayUri } from '@/uri'
import { getShareToken, getToken } from '@/user'

export const HIVE_LOG_TABLE = 'hive_log'

export const hiveLogActions = {
	STRUCTURE_ADD: 'STRUCTURE_ADD',
	STRUCTURE_REMOVE: 'STRUCTURE_REMOVE',
	STRUCTURE_MOVE: 'STRUCTURE_MOVE',
	TREATMENT: 'TREATMENT',
	INSPECTION: 'INSPECTION',
	LOCATION_MOVE: 'LOCATION_MOVE',
	NOTE: 'NOTE',
	QUEEN: 'QUEEN',
	COLLAPSE: 'COLLAPSE',
	LINEAGE: 'LINEAGE',
} as const

export type HiveLogAction = (typeof hiveLogActions)[keyof typeof hiveLogActions]

export type HiveLogEntry = {
	id?: number
	hiveId: number
	action: HiveLogAction
	title: string
	details?: string
	createdAt: string
	updatedAt?: string
	source?: 'system' | 'user'
	dedupeKey?: string
	relatedHives?: Array<{ id: number; hiveNumber?: number }>
}

type BackendHiveLog = {
	id: string
	hiveId: string
	action: HiveLogAction
	title: string
	details?: string
	source?: 'system' | 'user'
	dedupeKey?: string
	createdAt: string
	updatedAt?: string
	relatedHives?: Array<{ id: string; hiveNumber?: number }>
}

async function callHiveLogAPI<T>(query: string, variables: Record<string, any>): Promise<T> {
	const token = getToken()
	const shareToken = getShareToken()
	const response = await fetch(gatewayUri(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { token } : {}),
			...(shareToken ? { 'X-Share-Token': shareToken } : {}),
		},
		body: JSON.stringify({ query, variables }),
	})

	if (!response.ok) {
		throw new Error(`Hive log API request failed with status ${response.status}`)
	}

	const payload = await response.json()
	if (payload.errors?.length) {
		throw new Error(payload.errors[0]?.message || 'Hive log API error')
	}

	return payload.data as T
}

function fromBackendLog(log: BackendHiveLog): HiveLogEntry {
	return {
		id: +log.id,
		hiveId: +log.hiveId,
		action: log.action,
		title: log.title,
		details: log.details || '',
		source: log.source || 'system',
		dedupeKey: log.dedupeKey,
		createdAt: log.createdAt,
		updatedAt: log.updatedAt,
		relatedHives: (log.relatedHives || []).map((h) => ({ id: +h.id, hiveNumber: h.hiveNumber })),
	}
}

function toBackendRelatedHives(relatedHives?: Array<{ id: number; hiveNumber?: number }>) {
	if (!relatedHives) return []
	return relatedHives.map((h) => ({ id: String(h.id), hiveNumber: h.hiveNumber }))
}

export async function listHiveLogs(hiveId: number, limit = 300): Promise<HiveLogEntry[]> {
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
		console.warn(`Attempted to list hive logs with invalid hiveId: ${hiveId}`)
		return []
	}

	try {
		return await db[HIVE_LOG_TABLE]
			.where({ hiveId: +hiveId })
			.reverse()
			.sortBy('createdAt')
			.then((rows: HiveLogEntry[]) => rows.slice(0, limit))
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function syncHiveLogsFromBackend(hiveId: number, limit = 300): Promise<void> {
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) return
	try {
		const data = await callHiveLogAPI<{ hiveLogs: BackendHiveLog[] }>(
			`query hiveLogs($hiveId: ID!, $limit: Int) {
				hiveLogs(hiveId: $hiveId, limit: $limit) {
					id
					hiveId
					action
					title
					details
					source
					dedupeKey
					createdAt
					updatedAt
					relatedHives {
						id
						hiveNumber
					}
				}
			}`,
			{ hiveId: String(hiveId), limit }
		)

		const logs = (data?.hiveLogs || []).map(fromBackendLog)
		await db.transaction('rw', db[HIVE_LOG_TABLE], async () => {
			await db[HIVE_LOG_TABLE].where({ hiveId: +hiveId }).delete()
			if (logs.length > 0) {
				await db[HIVE_LOG_TABLE].bulkPut(logs)
			}
		})
	} catch (e) {
		console.error('Failed to sync hive logs from backend', e)
	}
}

export async function addHiveLog(input: {
	hiveId: number
	action: HiveLogAction
	title: string
	details?: string
	source?: 'system' | 'user'
	dedupeKey?: string
	relatedHives?: Array<{ id: number; hiveNumber?: number }>
}): Promise<number | undefined> {
	const hiveId = +input.hiveId
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0 || !input.title?.trim()) {
		console.warn('Invalid hive log input', input)
		return undefined
	}

	const dedupeKey = input.dedupeKey?.trim()
	if (dedupeKey) {
		const existing = await db[HIVE_LOG_TABLE].where({ dedupeKey }).first()
		if (existing?.id) {
			return +existing.id
		}
	}

	const now = new Date().toISOString()
	const localId = await db[HIVE_LOG_TABLE].add({
		hiveId,
		action: input.action,
		title: input.title.trim(),
		details: input.details?.trim() || '',
		createdAt: now,
		updatedAt: now,
		source: input.source || 'system',
		dedupeKey: dedupeKey || undefined,
		relatedHives: input.relatedHives || [],
	})

	try {
		const data = await callHiveLogAPI<{ addHiveLog: BackendHiveLog }>(
			`mutation addHiveLog($log: HiveLogInput!) {
				addHiveLog(log: $log) {
					id
					hiveId
					action
					title
					details
					source
					dedupeKey
					createdAt
					updatedAt
					relatedHives {
						id
						hiveNumber
					}
				}
			}`,
			{
				log: {
					hiveId: String(hiveId),
					action: input.action,
					title: input.title.trim(),
					details: input.details?.trim() || '',
					source: input.source || 'system',
					dedupeKey: dedupeKey || null,
					relatedHives: toBackendRelatedHives(input.relatedHives),
				},
			}
		)

		if (data?.addHiveLog) {
			const backendEntry = fromBackendLog(data.addHiveLog)
			if (localId && +localId !== backendEntry.id) {
				await db[HIVE_LOG_TABLE].delete(+localId)
			}
			await db[HIVE_LOG_TABLE].put(backendEntry)
			return backendEntry.id
		}
	} catch (e) {
		console.error('Failed to persist hive log on backend', e)
	}

	return +localId
}

export async function addManualHiveLogEntry(hiveId: number, text: string): Promise<number | undefined> {
	const clean = (text || '').trim()
	if (!clean) return undefined

	return await addHiveLog({
		hiveId,
		action: hiveLogActions.NOTE,
		title: clean,
		source: 'user',
	})
}

export async function updateHiveLogEntry(
	id: number,
	updates: { title?: string; details?: string }
): Promise<void> {
	if (!id || !Number.isFinite(id) || id <= 0) {
		console.warn(`Attempted to update hive log with invalid ID: ${id}`)
		return
	}

	const patch: Record<string, string> = {
		updatedAt: new Date().toISOString(),
	}

	if (updates.title !== undefined) {
		patch.title = updates.title.trim()
	}
	if (updates.details !== undefined) {
		patch.details = updates.details.trim()
	}

	await db[HIVE_LOG_TABLE].update(+id, patch)

	try {
		await callHiveLogAPI<{ updateHiveLog: BackendHiveLog }>(
			`mutation updateHiveLog($id: ID!, $log: HiveLogUpdateInput!) {
				updateHiveLog(id: $id, log: $log) { id }
			}`,
			{
				id: String(id),
				log: {
					title: updates.title !== undefined ? updates.title.trim() : null,
					details: updates.details !== undefined ? updates.details.trim() : null,
				},
			}
		)
	} catch (e) {
		console.error('Failed to update hive log on backend', e)
	}
}

export async function deleteHiveLogEntry(id: number): Promise<void> {
	if (!id || !Number.isFinite(id) || id <= 0) {
		console.warn(`Attempted to delete hive log with invalid ID: ${id}`)
		return
	}

	await db[HIVE_LOG_TABLE].delete(+id)

	try {
		await callHiveLogAPI<{ deleteHiveLog: boolean }>(
			`mutation deleteHiveLog($id: ID!) {
				deleteHiveLog(id: $id)
			}`,
			{ id: String(id) }
		)
	} catch (e) {
		console.error('Failed to delete hive log on backend', e)
	}
}

export function formatHiveLogAction(action: HiveLogAction): string {
	switch (action) {
		case hiveLogActions.STRUCTURE_ADD:
			return 'Structure added'
		case hiveLogActions.STRUCTURE_REMOVE:
			return 'Structure removed'
		case hiveLogActions.STRUCTURE_MOVE:
			return 'Structure moved'
		case hiveLogActions.TREATMENT:
			return 'Treatment'
		case hiveLogActions.INSPECTION:
			return 'Inspection'
		case hiveLogActions.LOCATION_MOVE:
			return 'Location changed'
		case hiveLogActions.NOTE:
			return 'Note'
		case hiveLogActions.QUEEN:
			return 'Queen state'
		case hiveLogActions.COLLAPSE:
			return 'Hive state'
		case hiveLogActions.LINEAGE:
			return 'Colony lineage'
		default:
			return 'Event'
	}
}

export async function syncHiveLineageLogs(hive: any): Promise<void> {
	if (!hive?.id) return
	const hiveId = +hive.id
	if (!hiveId || !Number.isFinite(hiveId)) return

	if (hive.parentHive?.id) {
		await addHiveLog({
			hiveId,
			action: hiveLogActions.LINEAGE,
			title: 'Split from another hive',
			details: hive.splitDate ? `Date: ${hive.splitDate}` : '',
			dedupeKey: `lineage:split-from:${hiveId}:${hive.parentHive.id}:${hive.splitDate || ''}`,
			relatedHives: [{ id: +hive.parentHive.id, hiveNumber: hive.parentHive.hiveNumber }],
		})
	}

	if (Array.isArray(hive.childHives)) {
		for (const child of hive.childHives) {
			if (!child?.id) continue
			await addHiveLog({
				hiveId,
				action: hiveLogActions.LINEAGE,
				title: 'Split created a child hive',
				details: child.splitDate ? `Date: ${child.splitDate}` : '',
				dedupeKey: `lineage:child:${hiveId}:${child.id}:${child.splitDate || ''}`,
				relatedHives: [{ id: +child.id, hiveNumber: child.hiveNumber }],
			})
		}
	}

	if (hive.mergedIntoHive?.id) {
		await addHiveLog({
			hiveId,
			action: hiveLogActions.LINEAGE,
			title: 'Merged into another hive',
			details: hive.mergeDate ? `Date: ${hive.mergeDate}` : '',
			dedupeKey: `lineage:merged-into:${hiveId}:${hive.mergedIntoHive.id}:${hive.mergeDate || ''}`,
			relatedHives: [{ id: +hive.mergedIntoHive.id, hiveNumber: hive.mergedIntoHive.hiveNumber }],
		})
	}

	if (Array.isArray(hive.mergedFromHives)) {
		for (const merged of hive.mergedFromHives) {
			if (!merged?.id) continue
			await addHiveLog({
				hiveId,
				action: hiveLogActions.LINEAGE,
				title: 'Merged from another hive',
				details: merged.mergeDate ? `Date: ${merged.mergeDate}` : '',
				dedupeKey: `lineage:merged-from:${hiveId}:${merged.id}:${merged.mergeDate || ''}`,
				relatedHives: [{ id: +merged.id, hiveNumber: merged.hiveNumber }],
			})
		}
	}
}
