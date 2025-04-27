import { db } from './db'

export type Hive = {
	id: number
	name?: string
	notes?: string
	familyId?: number
	beeCount?: number
	inspectionCount?: number
	status?: string
	collapse_date?: string // Add collapse_date field
	collapse_cause?: string // Add collapse_cause field

	isCollapsed?: () => boolean
	isEditable?: () => boolean
}

const HIVE_STATUS = {
	ACTIVE: 'active',
	COLLAPSED: 'collapsed',
}

// Utility functions to attach to Hive objects
export function isCollapsed(hive: Hive): boolean {
	return hive.status === HIVE_STATUS.COLLAPSED || !!hive.collapse_date;
}

export function isEditable(hive: Hive): boolean {
	return !isCollapsed(hive);
}

const TABLE_NAME = 'hive'

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
