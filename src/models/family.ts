import { db } from './db'

export type Family = {
	hiveId?: number
	id: number
	name?: string
	race: string
	added: string
	color?: string
	parentId?: number | null
	previewImageUrl?: string | null
	age?: number
	lastSeenFrameId?: number
	lastSeenFrameSideId?: number
	lastSeenBoxId?: number
	lastSeenAt?: string
  }

const TABLE_NAME = 'family'

export async function getFamilyByHive(hiveId: number): Promise<Family | undefined> {
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
		console.warn(`Attempted to get family with invalid hiveId: ${hiveId}`);
		return undefined;
	}

	try {
		return await db[TABLE_NAME].get({ hiveId: +hiveId });
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getFamilyById(familyId: number): Promise<Family | undefined> {
	if (!familyId || !Number.isFinite(familyId) || familyId <= 0) {
		console.warn(`Attempted to get family with invalid familyId: ${familyId}`);
		return undefined;
	}

	try {
		return await db[TABLE_NAME].get(+familyId);
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getAllFamiliesByHive(hiveId: number): Promise<Family[]> {
	if (!hiveId || !Number.isFinite(hiveId) || hiveId <= 0) {
		console.warn(`Attempted to get families with invalid hiveId: ${hiveId}`);
		return [];
	}

	try {
		const families = await db[TABLE_NAME].where({ hiveId: +hiveId }).toArray();
		console.log(`getAllFamiliesByHive(${hiveId}): found ${families.length} families`, families);
		return families;
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getFamiliesByIds(ids: number[]): Promise<Family[]> {
	const normalized = Array.from(
		new Set(
			(ids || [])
				.map((id) => Number(id))
				.filter((id) => Number.isFinite(id) && id > 0)
		)
	)

	if (!normalized.length) {
		return []
	}

	try {
		return await db[TABLE_NAME].where('id').anyOf(normalized).toArray()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getAssignedFamilies(): Promise<Family[]> {
	try {
		const families = await db[TABLE_NAME].toArray()
		return families.filter((family) => {
			const hiveId = Number(family?.hiveId)
			return Number.isFinite(hiveId) && hiveId > 0
		})
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getUnassignedFamilies(): Promise<Family[]> {
	try {
		const families = await db[TABLE_NAME].toArray()
		return families.filter((family) => {
			const hiveId = Number(family?.hiveId)
			return !Number.isFinite(hiveId) || hiveId <= 0
		})
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function getAllFamilies(): Promise<Family[]> {
	try {
		return await db[TABLE_NAME].toArray()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateFamily(data: Family) {
	try {
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function updateFamilyLastSeen(
	familyId: number,
	lastSeen: {
		frameId: number
		frameSideId: number
		boxId?: number
		seenAt?: string
	}
) {
	try {
		const family = await db[TABLE_NAME].get(familyId)
		if (!family) return

		family.lastSeenFrameId = lastSeen.frameId
		family.lastSeenFrameSideId = lastSeen.frameSideId
		if (lastSeen.boxId !== undefined) {
			family.lastSeenBoxId = lastSeen.boxId
		}
		family.lastSeenAt = lastSeen.seenAt || new Date().toISOString()
		await db[TABLE_NAME].put(family)
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function deleteFamily(familyId: number) {
	try {
		return await db[TABLE_NAME].delete(familyId)
	} catch (e) {
		console.error(e)
		throw e
	}
}
