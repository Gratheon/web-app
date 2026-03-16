import { useEffect, useState } from 'react'

import { gql, useMutation, useQuery } from '@/api'

type WarehouseCounts = Record<string, number>

const WAREHOUSE_AUTO_ADJUST_QUERY = gql`
{
	warehouseModules {
		moduleType
		count
	}
	warehouseSettings {
		autoUpdateFromHives
	}
}
`

const SET_WAREHOUSE_MODULE_COUNT_MUTATION = gql`
mutation setWarehouseModuleCount($moduleType: WarehouseModuleType!, $count: Int!) {
	setWarehouseModuleCount(moduleType: $moduleType, count: $count) {
		moduleType
		count
	}
}
`

const ADJUST_WAREHOUSE_FRAME_INVENTORY_MUTATION = gql`
mutation adjustWarehouseFrameInventory($boxId: ID!, $frameType: FrameType!, $delta: Int!) {
	adjustWarehouseFrameInventory(boxId: $boxId, frameType: $frameType, delta: $delta) {
		key
		count
	}
}
`

const ADJUST_WAREHOUSE_FRAME_INVENTORY_BY_FRAME_MUTATION = gql`
mutation adjustWarehouseFrameInventoryByFrame($frameId: ID!, $delta: Int!) {
	adjustWarehouseFrameInventoryByFrame(frameId: $frameId, delta: $delta) {
		key
		count
	}
}
`

function mapCounts(modules: Array<{ moduleType: string; count: number }> = []) {
	const counts: WarehouseCounts = {}

	for (const module of modules) {
		const value = Number(module.count)
		counts[module.moduleType] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
	}

	return counts
}

export function useWarehouseAutoAdjust() {
	const [counts, setCounts] = useState<WarehouseCounts>({})
	const [autoUpdateFromHives, setAutoUpdateFromHives] = useState(true)

	const { data } = useQuery(WAREHOUSE_AUTO_ADJUST_QUERY)
	const [setWarehouseModuleCount] = useMutation(SET_WAREHOUSE_MODULE_COUNT_MUTATION)
	const [adjustWarehouseFrameInventory] = useMutation(ADJUST_WAREHOUSE_FRAME_INVENTORY_MUTATION)
	const [adjustWarehouseFrameInventoryByFrame] = useMutation(ADJUST_WAREHOUSE_FRAME_INVENTORY_BY_FRAME_MUTATION)

	useEffect(() => {
		setCounts(mapCounts(data?.warehouseModules || []))

		if (typeof data?.warehouseSettings?.autoUpdateFromHives === 'boolean') {
			setAutoUpdateFromHives(data.warehouseSettings.autoUpdateFromHives)
		}
	}, [data?.warehouseModules, data?.warehouseSettings?.autoUpdateFromHives])

	async function updateModuleByDelta(moduleType?: string | null, delta = 0, respectAutoUpdateSetting = false) {
		if (!moduleType) {
			return
		}
		if (respectAutoUpdateSetting && !autoUpdateFromHives) return

		const previousValue = Math.max(0, Number(counts[moduleType]) || 0)
		const nextValue = Math.max(0, previousValue + delta)
		if (nextValue === previousValue) {
			return
		}

		setCounts((prev) => ({
			...prev,
			[moduleType]: nextValue,
		}))

		try {
			const result = await setWarehouseModuleCount({
				moduleType,
				count: nextValue,
			})

			if (!result?.data?.setWarehouseModuleCount) {
				setCounts((prev) => ({
					...prev,
					[moduleType]: previousValue,
				}))
				return
			}

			const confirmedValue = Math.max(0, Number(result.data.setWarehouseModuleCount.count) || 0)
			setCounts((prev) => ({
				...prev,
				[moduleType]: confirmedValue,
			}))
		} catch (e) {
			setCounts((prev) => ({
				...prev,
				[moduleType]: previousValue,
			}))
			console.error(e)
		}
	}

	async function decreaseWarehouseForType(moduleType?: string | null) {
		return updateModuleByDelta(moduleType, -1, true)
	}

	async function increaseWarehouseForType(moduleType?: string | null) {
		return updateModuleByDelta(moduleType, 1, false)
	}

	async function increaseWarehouseForTypeBy(moduleType?: string | null, amount = 1) {
		const safeAmount = Math.max(0, Math.floor(amount))
		if (safeAmount <= 0) return
		return updateModuleByDelta(moduleType, safeAmount, false)
	}

	async function decreaseWarehouseForFrame(boxId?: string | number | null, frameType?: string | null) {
		if (!boxId || !frameType) return
		if (!autoUpdateFromHives) return
		try {
			await adjustWarehouseFrameInventory({
				boxId: String(boxId),
				frameType,
				delta: -1,
			})
		} catch (e) {
			console.error(e)
		}
	}

	async function decreaseWarehouseForFrameBy(boxId?: string | number | null, frameType?: string | null, amount = 1) {
		if (!boxId || !frameType) return
		if (!autoUpdateFromHives) return
		const safeAmount = Math.max(0, Math.floor(amount))
		if (safeAmount <= 0) return
		try {
			await adjustWarehouseFrameInventory({
				boxId: String(boxId),
				frameType,
				delta: -safeAmount,
			})
		} catch (e) {
			console.error(e)
		}
	}

	async function increaseWarehouseForFrameByFrameId(frameId?: string | number | null) {
		if (!frameId) return
		try {
			await adjustWarehouseFrameInventoryByFrame({
				frameId: String(frameId),
				delta: 1,
			})
		} catch (e) {
			console.error(e)
		}
	}

	return {
		decreaseWarehouseForType,
		increaseWarehouseForType,
		increaseWarehouseForTypeBy,
		decreaseWarehouseForFrame,
		decreaseWarehouseForFrameBy,
		increaseWarehouseForFrameByFrameId,
	}
}
