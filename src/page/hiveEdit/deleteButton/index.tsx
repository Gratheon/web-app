import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import Button from '../../../shared/button'
import HIVE_DELETE_MUTATION from './hiveDeleteMutation.graphql.ts'
import { apiClient, gql, useMutation, useQuery } from '../../../api'
import Loading from '../../../shared/loader'
import Modal from '../../../shared/modal'
import { getBoxes, boxTypes } from '@/models/boxes'
import { getFrames } from '@/models/frames'
import { getHive } from '@/models/hive'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'

import DeleteIcon from '../../../icons/deleteIcon.tsx'
import T from '../../../shared/translate'
import styles from './styles.module.less'

const WAREHOUSE_BY_BOX_TYPE = {
	[boxTypes.DEEP]: 'DEEP',
	[boxTypes.SUPER]: 'SUPER',
	[boxTypes.LARGE_HORIZONTAL_SECTION]: 'LARGE_HORIZONTAL_SECTION',
	[boxTypes.ROOF]: 'ROOF',
	[boxTypes.BOTTOM]: 'BOTTOM',
	[boxTypes.QUEEN_EXCLUDER]: 'QUEEN_EXCLUDER',
	[boxTypes.HORIZONTAL_FEEDER]: 'HORIZONTAL_FEEDER',
}

function resolveWarehouseModuleTypeForBox(boxType: string, hiveType?: string | null) {
	if (boxType === boxTypes.DEEP && String(hiveType || '').toUpperCase() === 'NUCLEUS') {
		return 'NUCS'
	}
	return WAREHOUSE_BY_BOX_TYPE[boxType]
}

const WAREHOUSE_INVENTORY_QUERY = gql`
	query HiveDeleteWarehouseInventory {
		warehouseInventory {
			key
			kind
			moduleType
			count
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

function getSystemIdFromBoxInventoryKey(itemKey?: string): string | undefined {
	if (!itemKey) return undefined
	const match = String(itemKey).match(/^BOX:[^:]+:SYSTEM:(\d+)$/)
	return match?.[1]
}

export default function deactivateButton({ hiveId }) {
	let [updateHive] = useMutation(HIVE_DELETE_MUTATION)
	let [setWarehouseInventoryCount] = useMutation(SET_WAREHOUSE_INVENTORY_COUNT_MUTATION)
	let navigate = useNavigate()
	const [deleting, setDeleting] = useState(false)
	const [removeHiveDialogVisible, setRemoveHiveDialogVisible] = useState(false)
	const { increaseWarehouseForTypeBy, increaseWarehouseForFrameByFrameId } = useWarehouseAutoAdjust()
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const { data: warehouseInventoryData } = useQuery(WAREHOUSE_INVENTORY_QUERY)
	const frameSourceByTargetAndModuleType = (warehouseInventoryData?.boxSystemFrameSettings || []).reduce((acc: Record<string, string>, setting: any) => {
		const moduleType =
			setting.boxType === 'DEEP' ? 'DEEP'
			: setting.boxType === 'SUPER' ? 'SUPER'
			: setting.boxType === 'LARGE_HORIZONTAL_SECTION' ? 'LARGE_HORIZONTAL_SECTION'
			: ''
		if (!moduleType) return acc
		acc[`${setting.systemId}:${moduleType}`] = String(setting.frameSourceSystemId || setting.systemId)
		return acc
	}, {} as Record<string, string>)

	function resolveEffectiveFrameSourceSystemId(targetSystemId: string, moduleType: string): string {
		let current = String(targetSystemId || '')
		const visited = new Set<string>()
		while (current && !visited.has(current)) {
			visited.add(current)
			const mapped = frameSourceByTargetAndModuleType[`${current}:${moduleType}`]
			if (!mapped || mapped === current) return current
			current = mapped
		}
		return String(targetSystemId || '')
	}

	useEffect(() => {
		if (!removeHiveDialogVisible) return

		const onKeyDown = async (event: KeyboardEvent) => {
			if (deleting) return

			if (event.key === 'Escape') {
				event.preventDefault()
				event.stopPropagation()
				setRemoveHiveDialogVisible(false)
				return
			}

			if (event.key === 'Enter') {
				event.preventDefault()
				event.stopPropagation()
				await onHiveRemoveChoice('warehouse')
			}
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
		}
	}, [removeHiveDialogVisible, deleting, hiveId])

	async function onHiveRemoveChoice(mode: 'trash' | 'warehouse') {
		setRemoveHiveDialogVisible(false)
		if (deleting) return
		try {
			setDeleting(true)

			if (mode === 'warehouse') {
				const hiveBoxes = await getBoxes({ hiveId: +hiveId })
				const boxModuleTotals: Record<string, number> = {}
				const hiveSystemId = String(hive?.boxSystemId || hive?.box_system_id || '')
				const nucPreferredSystemId = hiveSystemId ? resolveEffectiveFrameSourceSystemId(hiveSystemId, 'DEEP') : ''
				const hiveType = String(hive?.hiveType || '')
				for (const box of hiveBoxes) {
					const moduleType = resolveWarehouseModuleTypeForBox(box?.type, hiveType)
					if (moduleType) {
						boxModuleTotals[moduleType] = (boxModuleTotals[moduleType] || 0) + 1
					}

					const boxFrames = (await getFrames({ boxId: +box.id })) || []
					for (const frame of boxFrames) {
						if (!frame?.id) continue
						await increaseWarehouseForFrameByFrameId(frame.id)
					}
				}

				const inventoryResponse = await apiClient
					.query(WAREHOUSE_INVENTORY_QUERY, {}, { requestPolicy: 'network-only' })
					.toPromise()
				const inventoryItems = inventoryResponse?.data?.warehouseInventory || warehouseInventoryData?.warehouseInventory || []
				const inventoryCountsByKey = inventoryItems.reduce((acc: Record<string, number>, item: any) => {
					const key = String(item?.key || '')
					if (!key) return acc
					acc[key] = Math.max(0, Number(item?.count) || 0)
					return acc
				}, {})

				for (const [moduleType, amount] of Object.entries(boxModuleTotals)) {
					const safeAmount = Math.max(0, Number(amount) || 0)
					if (!moduleType || safeAmount <= 0) continue

					const candidates = inventoryItems.filter((item: any) => {
						return item?.kind === 'BOX_MODULE' && String(item?.moduleType || '') === moduleType
					})
					const preferredSystemId = moduleType === 'NUCS' ? nucPreferredSystemId : hiveSystemId
					const preferred = candidates.find((item: any) => getSystemIdFromBoxInventoryKey(item?.key) === preferredSystemId)
					const target = preferred || candidates[0]

					if (!target?.key) {
						await increaseWarehouseForTypeBy(moduleType, safeAmount)
						continue
					}

					const currentValue = Math.max(0, Number(inventoryCountsByKey[target.key]) || 0)
					const nextValue = currentValue + safeAmount
					const updateResult = await setWarehouseInventoryCount({
						itemKey: String(target.key),
						count: nextValue,
					})
					inventoryCountsByKey[target.key] = Math.max(
						0,
						Number(updateResult?.data?.setWarehouseInventoryCount?.count ?? nextValue) || 0
					)
				}
			}

			await updateHive({
				id: hiveId,
			})
			navigate(`/apiaries`, { replace: true })
		} finally {
			setDeleting(false)
		}
	}

	return (
		<>
			<Button loading={deleting} color="red" onClick={() => setRemoveHiveDialogVisible(true)} title="Remove hive">
				<DeleteIcon /><span><T ctx="this is a button">Remove hive</T></span>
			</Button>
			{removeHiveDialogVisible && (
				<Modal
					title={<T>Remove hive</T>}
					onClose={() => setRemoveHiveDialogVisible(false)}
					className={styles.removeHiveModal}
				>
					<div style={{ marginBottom: '12px' }}>
						<T>Are you sure you want to remove this hive?</T>
					</div>
					<div
						className={styles.removeHiveActions}
						style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}
					>
						<div className={styles.actionWithHint}>
							<Button color="gray" onClick={() => setRemoveHiveDialogVisible(false)}>
								<T>Cancel</T>
							</Button>
							<div className={styles.keyHint}>Esc</div>
						</div>
						<div className={styles.actionWithHint}>
							<Button color="red" onClick={async () => await onHiveRemoveChoice('trash')}>
								<T>To trash</T>
							</Button>
						</div>
						<div className={styles.actionWithHint}>
							<Button color="green" onClick={async () => await onHiveRemoveChoice('warehouse')}>
								<T>To warehouse</T>
							</Button>
							<div className={styles.keyHint}>Enter</div>
						</div>
					</div>
				</Modal>
			)}
		</>
	)
}
