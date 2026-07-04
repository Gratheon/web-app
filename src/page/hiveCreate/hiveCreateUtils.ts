import { boxTypes, GATE_HOLE_COUNT_DEFAULT } from '@/models/boxes'

import { defaultBoxColor } from './constants'

const WAREHOUSE_BY_BOX_TYPE: Record<string, string> = {
	[boxTypes.DEEP]: 'DEEP',
	[boxTypes.SUPER]: 'SUPER',
	[boxTypes.LARGE_HORIZONTAL_SECTION]: 'LARGE_HORIZONTAL_SECTION',
	[boxTypes.ROOF]: 'ROOF',
	[boxTypes.BOTTOM]: 'BOTTOM',
	[boxTypes.QUEEN_EXCLUDER]: 'QUEEN_EXCLUDER',
	[boxTypes.HORIZONTAL_FEEDER]: 'HORIZONTAL_FEEDER',
}

export function resolveWarehouseModuleTypeForBox(
	boxType: string,
	hiveType?: string | null
) {
	if (
		boxType === boxTypes.DEEP &&
		String(hiveType || '').toUpperCase() === 'NUCLEUS'
	) {
		return 'NUCS'
	}
	return WAREHOUSE_BY_BOX_TYPE[boxType]
}

export function getSystemIdFromBoxInventoryKey(
	itemKey?: string
): string | undefined {
	if (!itemKey) return undefined
	const match = String(itemKey).match(/^BOX:[^:]+:SYSTEM:(\d+)$/)
	return match?.[1]
}

export function getFrameModuleTypeByCode(
	frameCode?: string | null
): string | null {
	const code = String(frameCode || '')
	if (code.endsWith('_DEEP')) return 'DEEP'
	if (code.endsWith('_SUPER')) return 'SUPER'
	if (code.endsWith('_HORIZONTAL')) return 'LARGE_HORIZONTAL_SECTION'
	return null
}

export function getModuleInventoryKeys(
	moduleType: string,
	warehouseInventory: any[],
	preferredSystemId?: string
) {
	const candidates = (warehouseInventory || []).filter((item: any) => {
		return (
			item?.kind === 'BOX_MODULE' &&
			String(item?.moduleType || '') === moduleType
		)
	})
	if (!preferredSystemId) {
		return candidates.map((item: any) => String(item.key))
	}
	const preferred = candidates.filter(
		(item: any) =>
			getSystemIdFromBoxInventoryKey(item?.key) === preferredSystemId
	)
	const fallback = candidates.filter(
		(item: any) =>
			getSystemIdFromBoxInventoryKey(item?.key) !== preferredSystemId
	)
	return [...preferred, ...fallback].map((item: any) => String(item.key))
}

export function createDefaultBoxes(hiveType: string, boxCount: number) {
	const primaryBoxType =
		hiveType === 'horizontal'
			? boxTypes.LARGE_HORIZONTAL_SECTION
			: boxTypes.DEEP

	const initialBoxes = []
	for (let i = 0; i < boxCount; i++) {
		initialBoxes.push({
			color: hiveType === 'nucleus' ? '#cda36a' : `${defaultBoxColor}`,
			type: primaryBoxType,
		})
	}
	if (hiveType === 'nucleus') {
		return initialBoxes
	}
	initialBoxes.push({
		type: boxTypes.GATE,
		holeCount: GATE_HOLE_COUNT_DEFAULT,
	})
	initialBoxes.push({
		type: boxTypes.ROOF,
	})
	initialBoxes.push({
		type: boxTypes.BOTTOM,
	})
	return initialBoxes
}
