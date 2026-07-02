import { useEffect, useMemo, useState } from 'react'

import { gql, useMutation, useQuery } from '@/api'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T, { useTranslation } from '@/shared/translate'
import styles from './style.module.less'
import WarehouseInventoryList from './WarehouseInventoryList'
import type { BoxSystem, BoxSystemFrameSetting, WarehouseCounts, WarehouseInventoryItem } from './types'
import {
	buildFrameSourceByTargetAndModuleType,
	buildWarehouseGroups,
	mapCounts,
	resolveEffectiveFrameSourceSystemId as resolveFrameSourceSystemId,
	getSystemIdFromBoxInventoryKey,
} from './helpers'

const WAREHOUSE_QUERY = gql`
{
	warehouseInventory {
		key
		kind
		groupKey
		title
		description
		count
		moduleType
		frameSpec {
			id
			code
			frameType
			displayName
			systemId
		}
	}
	warehouseSettings {
		autoUpdateFromHives
	}
	boxSystems {
		id
		name
		isDefault
		boxProfileSourceSystemId
	}
	boxSystemFrameSettings {
		systemId
		boxType
		frameSourceSystemId
	}
}
`

const SET_WAREHOUSE_INVENTORY_COUNT_MUTATION = gql`
mutation setWarehouseInventoryCount($itemKey: String!, $count: Int!) {
	setWarehouseInventoryCount(itemKey: $itemKey, count: $count) {
		key
		count
	}
}
`

const SET_WAREHOUSE_AUTO_UPDATE_MUTATION = gql`
mutation setWarehouseAutoUpdateFromHives($enabled: Boolean!) {
	setWarehouseAutoUpdateFromHives(enabled: $enabled) {
		autoUpdateFromHives
	}
}
`

export default function WarehousePage() {
	const [counts, setCounts] = useState<WarehouseCounts>({})
	const [inputs, setInputs] = useState<Record<string, string>>({})
	const [savingItem, setSavingItem] = useState<string | null>(null)
	const [autoUpdateFromHives, setAutoUpdateFromHives] = useState(true)
	const [savingAutoUpdate, setSavingAutoUpdate] = useState(false)
	const decreaseTitle = useTranslation('Decrease')
	const increaseTitle = useTranslation('Increase')

	const { data, loading, error } = useQuery(WAREHOUSE_QUERY)
	const [setWarehouseInventoryCount, { error: mutationError }] = useMutation(SET_WAREHOUSE_INVENTORY_COUNT_MUTATION)
	const [setWarehouseAutoUpdate, { error: settingsMutationError }] = useMutation(SET_WAREHOUSE_AUTO_UPDATE_MUTATION)

	const items: WarehouseInventoryItem[] = useMemo(() => data?.warehouseInventory || [], [data?.warehouseInventory])
	const boxSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const linkedBoxSystemIds = useMemo(() => {
		return new Set(
			boxSystems
				.filter((system) => !!system.boxProfileSourceSystemId)
				.map((system) => String(system.id))
		)
	}, [boxSystems])
	const boxSystemFrameSettings: BoxSystemFrameSetting[] = useMemo(() => data?.boxSystemFrameSettings || [], [data?.boxSystemFrameSettings])
	const frameSourceByTargetAndModuleType = useMemo(
		() => buildFrameSourceByTargetAndModuleType(boxSystemFrameSettings),
		[boxSystemFrameSettings]
	)
	const resolveEffectiveFrameSourceSystemId = (targetSystemId: string, moduleType: string) => {
		return resolveFrameSourceSystemId(frameSourceByTargetAndModuleType, targetSystemId, moduleType)
	}

	useEffect(() => {
		const nextCounts = mapCounts(items)
		setCounts(nextCounts)
		setInputs(
			items.reduce<Record<string, string>>((acc, item) => {
				acc[item.key] = String(nextCounts[item.key] || 0)
				return acc
			}, {})
		)

		if (typeof data?.warehouseSettings?.autoUpdateFromHives === 'boolean') {
			setAutoUpdateFromHives(data.warehouseSettings.autoUpdateFromHives)
		}
	}, [items, data?.warehouseSettings?.autoUpdateFromHives])

	const groups = useMemo(() => buildWarehouseGroups(items, boxSystems), [items, boxSystems])

	async function saveCount(itemKey: string, nextValue: number) {
		const previousValue = counts[itemKey] || 0
		if (nextValue === previousValue) return

		setCounts((prev) => ({ ...prev, [itemKey]: nextValue }))
		setSavingItem(itemKey)

		const result = await setWarehouseInventoryCount({ itemKey, count: nextValue })
		setSavingItem(null)

		if (result?.data?.setWarehouseInventoryCount) {
			const confirmedValue = Math.max(0, Number(result.data.setWarehouseInventoryCount.count) || 0)
			setCounts((prev) => ({ ...prev, [itemKey]: confirmedValue }))
			setInputs((prev) => ({ ...prev, [itemKey]: String(confirmedValue) }))
			return
		}

		setCounts((prev) => ({ ...prev, [itemKey]: previousValue }))
		setInputs((prev) => ({ ...prev, [itemKey]: String(previousValue) }))
	}

	async function updateCount(itemKey: string, delta: number) {
		const nextValue = Math.max(0, (counts[itemKey] || 0) + delta)
		setInputs((prev) => ({ ...prev, [itemKey]: String(nextValue) }))
		await saveCount(itemKey, nextValue)
	}

	async function updateHorizontalFrameRowCount(rowItems: WarehouseInventoryItem[], delta: number) {
		if (!rowItems.length || delta === 0) return
		const canonical =
			rowItems.find((item) => {
				const systemId = getSystemIdFromBoxInventoryKey(item.key)
				if (!systemId) return false
				return boxSystems.some((system) => system.isDefault && system.id === systemId)
			}) || rowItems[0]

		if (delta > 0) {
			await updateCount(canonical.key, delta)
			return
		}

		let toRemove = Math.abs(delta)
		const orderedKeys = [canonical.key, ...rowItems.map((item) => item.key).filter((key) => key !== canonical.key)]
		for (const key of orderedKeys) {
			if (toRemove <= 0) break
			const available = counts[key] || 0
			if (available <= 0) continue
			const take = Math.min(available, toRemove)
			await saveCount(key, available - take)
			setInputs((prev) => ({ ...prev, [key]: String(Math.max(0, available - take)) }))
			toRemove -= take
		}
	}

	function onInputChange(itemKey: string, value: string) {
		const digitsOnly = value.replace(/[^\d]/g, '')
		setInputs((prev) => ({ ...prev, [itemKey]: digitsOnly }))
	}

	async function onInputCommit(itemKey: string) {
		const raw = inputs[itemKey] ?? '0'
		const parsed = Number.parseInt(raw === '' ? '0' : raw, 10)
		const nextValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
		setInputs((prev) => ({ ...prev, [itemKey]: String(nextValue) }))
		await saveCount(itemKey, nextValue)
	}

	async function onAutoUpdateToggle(nextValue: boolean) {
		const previous = autoUpdateFromHives
		setAutoUpdateFromHives(nextValue)
		setSavingAutoUpdate(true)

		const result = await setWarehouseAutoUpdate({ enabled: nextValue })
		setSavingAutoUpdate(false)

		if (typeof result?.data?.setWarehouseAutoUpdateFromHives?.autoUpdateFromHives === 'boolean') {
			setAutoUpdateFromHives(result.data.setWarehouseAutoUpdateFromHives.autoUpdateFromHives)
			return
		}

		setAutoUpdateFromHives(previous)
	}

	if (loading && !data?.warehouseInventory) return <Loader />

	return (
		<div className={styles.page}>
			<h2><T>Warehouse</T></h2>
			<p className={styles.description}>
				<T>Track available hive modules with simple count operations.</T>
			</p>
			<ErrorMsg error={error || mutationError || settingsMutationError} />

			<div className={styles.topSetting}>
				<label className={styles.switchRow}>
					<input
						className={styles.switchInput}
						type="checkbox"
						checked={autoUpdateFromHives}
						disabled={savingAutoUpdate}
						onChange={(event: any) => onAutoUpdateToggle(!!event.target.checked)}
					/>
					<span className={styles.switchTrack} aria-hidden="true"><span className={styles.switchThumb}></span></span>
					<span className={styles.switchLabel}>
						<T>Automatically update warehouse count when hives are updated</T>
					</span>
				</label>
			</div>

			<WarehouseInventoryList
				groups={groups}
				boxSystems={boxSystems}
				linkedBoxSystemIds={linkedBoxSystemIds}
				counts={counts}
				inputs={inputs}
				savingItem={savingItem}
				decreaseTitle={decreaseTitle}
				increaseTitle={increaseTitle}
				resolveEffectiveFrameSourceSystemId={resolveEffectiveFrameSourceSystemId}
				updateHorizontalFrameRowCount={updateHorizontalFrameRowCount}
				updateCount={updateCount}
				onInputChange={onInputChange}
				onInputCommit={onInputCommit}
			/>
		</div>
	)
}
