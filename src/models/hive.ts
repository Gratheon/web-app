import { db } from './db'
export { db };

export type Hive = {
	id: number
	name?: string
	notes?: string
	familyId?: number
	beeCount?: number
	inspectionCount?: number
	status?: string
	collapse_date?: string
	collapse_cause?: string
	splitDate?: string
	parentHive?: {
		id: number
		name: string
	}
	childHives?: Array<{
		id: number
		name: string
		splitDate?: string
	}>
	mergeDate?: string
	mergeType?: string
	mergedIntoHive?: {
		id: number
		name: string
	}
	mergedFromHives?: Array<{
		id: number
		name: string
		mergeDate?: string
		mergeType?: string
	}>

	isCollapsed?: () => boolean
	isEditable?: () => boolean
	isMerged?: () => boolean
}

const HIVE_STATUS = {
	ACTIVE: 'active',
	COLLAPSED: 'collapsed',
	MERGED: 'merged',
}

export function isCollapsed(hive: Hive): boolean {
	return hive.status === HIVE_STATUS.COLLAPSED || !!hive.collapse_date;
}

export function isMerged(hive: Hive): boolean {
	return hive.status === HIVE_STATUS.MERGED || !!hive.mergedIntoHive;
}

export function isEditable(hive: Hive): boolean {
	return !isCollapsed(hive) && !isMerged(hive);
}

const TABLE_NAME = 'hive'

export async function getHives(): Promise<Hive[]> {
    try {
        return await db[TABLE_NAME].toArray();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function bulkUpsertHives(hives: Hive[]): Promise<void> {
    if (!hives || !Array.isArray(hives) || hives.length === 0) return;
    try {
        await db[TABLE_NAME].bulkPut(hives);
    } catch (e) {
        console.error('Failed to bulk upsert hives:', e);
    }
}

export async function getHive(id: number): Promise<Hive | undefined> {
	// Validate ID before querying
	if (!id || !Number.isFinite(id) || id <= 0) {
		console.warn(`Attempted to get hive with invalid ID: ${id}`);
		return undefined; // Return undefined for invalid IDs
	}

	try {
		// Ensure ID passed to Dexie is a number
		return await db[TABLE_NAME].get(+id);
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function setHiveCollapsed(hive: Hive, collapse_date: string, collapse_cause: string) {
	hive.status = HIVE_STATUS.COLLAPSED;
	hive.collapse_date = collapse_date;
	hive.collapse_cause = collapse_cause;

	await updateHive(hive);

	return hive;
}

export async function updateHive(data: Hive) {
	try {
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
