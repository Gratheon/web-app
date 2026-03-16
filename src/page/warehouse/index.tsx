import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { getWarehouseItemIcon } from './iconMap'
import { stripWarehouseSuffix } from './labels'
import styles from './style.module.less'

type WarehouseInventoryItem = {
	key: string
	kind: string
	groupKey: string
	title: string
	description: string
	count: number
	moduleType?: string | null
	frameSpec?: {
		id: string
		code: string
		frameType: string
		displayName: string
		systemId: string
	} | null
}

type WarehouseCounts = Record<string, number>

type BoxSystem = {
	id: string
	name: string
	isDefault: boolean
	boxProfileSourceSystemId?: string | null
}

type BoxSystemFrameSetting = {
	systemId: string
	boxType: 'DEEP' | 'SUPER' | 'LARGE_HORIZONTAL_SECTION'
	frameSourceSystemId?: string | null
}

type SectionMatrixRow = {
	id: string
	label: string
	itemsBySystemId: Record<string, WarehouseInventoryItem>
}

type SectionMatrix = {
	id: string
	label: string
	description: string
	sectionItemBySystemId: Record<string, WarehouseInventoryItem>
	standaloneSectionItem?: WarehouseInventoryItem
	iconItem?: WarehouseInventoryItem
	rows: SectionMatrixRow[]
}

type PartMatrixRow = {
	id: string
	label: string
	description: string
	itemsBySystemId: Record<string, WarehouseInventoryItem>
	iconItem?: WarehouseInventoryItem
}

type WarehouseGroup = {
	id: string
	title: string
	items: Array<WarehouseInventoryItem | SectionMatrix | PartMatrixRow>
}

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

const GROUP_LABELS: Record<string, string> = {
	HIVE_PARTS: 'Hive parts',
	HIVE_SECTIONS: 'Hive sections',
	HORIZONTAL_HIVES: 'Horizontal hives',
}

const GROUP_ORDER = ['HIVE_SECTIONS', 'HIVE_PARTS', 'HORIZONTAL_HIVES']

const MAX_VISUAL_SQUARES = 100
const SQUARE_PITCH = 5
const SQUARE_COLUMNS = 12
const SQUARE_AREA_HEIGHT = 52

function getSquareStyle(index: number) {
	const column = index % SQUARE_COLUMNS
	const row = Math.floor(index / SQUARE_COLUMNS)
	const x = column * SQUARE_PITCH
	const y = SQUARE_AREA_HEIGHT - 3 - row * SQUARE_PITCH
	const delay = Math.min(index * 0.01, 0.35)

	return {
		left: `${x}px`,
		top: `${y}px`,
		animationDelay: `${delay}s`,
	}
}

function mapCounts(items: WarehouseInventoryItem[] = []) {
	const counts: WarehouseCounts = {}
	for (const item of items) {
		const value = Number(item.count)
		counts[item.key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
	}
	return counts
}

function getSystemIdFromBoxInventoryKey(itemKey?: string): string | undefined {
	if (!itemKey) return undefined
	const match = String(itemKey).match(/^BOX:[^:]+:SYSTEM:(\d+)$/)
	return match?.[1]
}

const SYSTEM_COLOR_PALETTE = [
	{ accent: '#2f80ed', soft: '#eaf2ff', border: '#a8c7f7' },
	{ accent: '#f2994a', soft: '#fff2e8', border: '#f5c59a' },
	{ accent: '#27ae60', soft: '#e9f8ef', border: '#9ad8b3' },
	{ accent: '#eb5757', soft: '#ffecec', border: '#f1a7a7' },
]

function getSystemPaletteByIndex(index = 0) {
	return SYSTEM_COLOR_PALETTE[index % SYSTEM_COLOR_PALETTE.length]
}

function getSystemThemeStyle(systemId?: string, fallbackIndex = 0) {
	const c = getSystemPaletteByIndex(fallbackIndex)
	return {
		['--system-accent' as any]: c.accent,
		['--system-soft' as any]: c.soft,
		['--item-color' as any]: c.accent,
		['--item-border' as any]: c.border,
	}
}

function buildSystemColorSquares(items: Array<{ count: number; color: string }>) {
	const squares: string[] = []
	for (const item of items) {
		if (squares.length >= MAX_VISUAL_SQUARES) break
		const count = Math.max(0, Math.floor(item.count))
		for (let i = 0; i < count && squares.length < MAX_VISUAL_SQUARES; i++) {
			squares.push(item.color)
		}
	}
	return squares
}

export default function WarehousePage() {
	const [counts, setCounts] = useState<WarehouseCounts>({})
	const [inputs, setInputs] = useState<Record<string, string>>({})
	const [savingItem, setSavingItem] = useState<string | null>(null)
	const [autoUpdateFromHives, setAutoUpdateFromHives] = useState(true)
	const [savingAutoUpdate, setSavingAutoUpdate] = useState(false)

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
	const frameSourceByTargetAndModuleType = useMemo(() => {
		return (boxSystemFrameSettings || []).reduce<Record<string, string>>((acc, setting) => {
			const moduleType =
				setting.boxType === 'DEEP' ? 'DEEP'
				: setting.boxType === 'SUPER' ? 'SUPER'
				: setting.boxType === 'LARGE_HORIZONTAL_SECTION' ? 'LARGE_HORIZONTAL_SECTION'
				: ''
			if (!moduleType) return acc
			acc[`${setting.systemId}:${moduleType}`] = String(setting.frameSourceSystemId || setting.systemId)
			return acc
		}, {})
	}, [boxSystemFrameSettings])

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

	const groups: WarehouseGroup[] = useMemo(() => {
		const grouped = items.reduce<Record<string, any[]>>((acc, item) => {
			const key = item.groupKey || 'OTHER'
			if (!acc[key]) acc[key] = []
			acc[key].push(item)
			return acc
		}, {})

		const sectionItems = (grouped.HIVE_SECTIONS || []).filter((item) => item.kind === 'BOX_MODULE')
		const partItems = (grouped.HIVE_PARTS || []).filter((item) => item.kind === 'BOX_MODULE')
		const frameItems = items.filter((item) => item.kind === 'FRAME_SPEC')

		const sectionGroupsByType = new Map<string, {
			id: string
			label: string
			description: string
			sectionItemBySystemId: Record<string, WarehouseInventoryItem>
			standaloneSectionItem?: WarehouseInventoryItem
			iconItem?: WarehouseInventoryItem
		}>()
		for (const section of sectionItems) {
			const moduleType = String(section.moduleType || '')
			if (!moduleType) continue
			if (!sectionGroupsByType.has(moduleType)) {
				sectionGroupsByType.set(moduleType, {
					id: moduleType,
					label: section.title,
					description: section.description,
					sectionItemBySystemId: {},
					iconItem: section,
				})
			}
			const group = sectionGroupsByType.get(moduleType)!
			const systemId = getSystemIdFromBoxInventoryKey(section.key)
			if (systemId) {
				group.sectionItemBySystemId[systemId] = section
			} else {
				group.standaloneSectionItem = section
			}
		}

		const childrenBySectionKey: Record<string, WarehouseInventoryItem[]> = {}
		for (const frame of frameItems) {
			const code = String(frame?.frameSpec?.code || '')
			let parentModuleType: string | null = null
			if (code.endsWith('_DEEP')) parentModuleType = 'DEEP'
			if (code.endsWith('_SUPER')) parentModuleType = 'SUPER'
			if (code.endsWith('_HORIZONTAL')) parentModuleType = 'LARGE_HORIZONTAL_SECTION'
			if (!parentModuleType) continue
			if (!childrenBySectionKey[parentModuleType]) childrenBySectionKey[parentModuleType] = []
			childrenBySectionKey[parentModuleType].push(frame)
		}

		const matrixByModuleType = new Map<string, SectionMatrix>()
		for (const [moduleType, group] of sectionGroupsByType.entries()) {
			matrixByModuleType.set(moduleType, {
				id: group.id,
				label: stripWarehouseSuffix(group.label),
				description: group.description,
				sectionItemBySystemId: group.sectionItemBySystemId,
				standaloneSectionItem: group.standaloneSectionItem,
				iconItem: group.iconItem,
				rows: [],
			})
		}

		for (const [moduleType] of sectionGroupsByType.entries()) {
			const framesForSection = childrenBySectionKey[moduleType] || []
			const rowById = new Map<string, SectionMatrixRow>()
			for (const frame of framesForSection) {
				const rawLabel = String(frame.frameSpec?.displayName || frame.title || frame.frameSpec?.frameType || '').trim()
				const label = stripWarehouseSuffix(rawLabel) || 'Unknown frame type'
				const rowId = `${moduleType}::${label.toLowerCase()}`
				if (!rowById.has(rowId)) {
					rowById.set(rowId, {
						id: rowId,
						label,
						itemsBySystemId: {},
					})
				}
				const sourceSystemId = String(frame.frameSpec?.systemId || '')
					if (sourceSystemId && boxSystems.some((system) => system.id === sourceSystemId)) {
						rowById.get(rowId)!.itemsBySystemId[sourceSystemId] = frame
					}
				}
			const matrix = matrixByModuleType.get(moduleType)
			if (matrix) {
				matrix.rows = Array.from(rowById.values()).sort((a, b) => a.label.localeCompare(b.label))
			}
		}

		const horizontalMatrix = matrixByModuleType.get('LARGE_HORIZONTAL_SECTION')
		if (horizontalMatrix) {
			grouped.HORIZONTAL_HIVES = [horizontalMatrix] as any
			matrixByModuleType.delete('LARGE_HORIZONTAL_SECTION')
		}

		grouped.HIVE_SECTIONS = Array.from(matrixByModuleType.values())

		const partSingles: WarehouseInventoryItem[] = []
		const partRowsByType = new Map<string, PartMatrixRow>()
		for (const part of partItems) {
			const systemId = getSystemIdFromBoxInventoryKey(part.key)
			if (!systemId) {
				partSingles.push(part)
				continue
			}
			const moduleType = String(part.moduleType || 'UNKNOWN')
				if (!partRowsByType.has(moduleType)) {
					partRowsByType.set(moduleType, {
						id: moduleType,
						label: stripWarehouseSuffix(part.title),
						description: part.description,
						itemsBySystemId: {},
						iconItem: part,
					})
				}
				partRowsByType.get(moduleType)!.itemsBySystemId[systemId] = part
			}
		const partMatrixRows = Array.from(partRowsByType.values()).sort((a, b) => a.label.localeCompare(b.label))
		grouped.HIVE_PARTS = [...partMatrixRows, ...partSingles] as any

		delete grouped.FRAMES

		const ordered = [...GROUP_ORDER, ...Object.keys(grouped).filter((key) => !GROUP_ORDER.includes(key))]
		return ordered
			.filter((groupKey) => (grouped[groupKey] || []).length > 0)
			.map((groupKey) => ({
				id: groupKey,
				title: GROUP_LABELS[groupKey] || groupKey,
				items: grouped[groupKey] as Array<WarehouseInventoryItem | SectionMatrix | PartMatrixRow>,
			}))
	}, [items, boxSystems, boxSystemFrameSettings])

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
					<span className={styles.switchTrack} aria-hidden="true">
						<span className={styles.switchThumb}></span>
					</span>
					<span className={styles.switchLabel}>
						<T>Automatically update warehouse count when hives are updated</T>
					</span>
				</label>
			</div>

				<div className={styles.list}>
					{groups.map((group) => (
						<section className={styles.group} key={group.id}>
							<div className={styles.groupItems}>
								{group.id === 'HIVE_SECTIONS' ? (
									group.items.map((matrixItem: SectionMatrix) => {
										const icon = matrixItem.iconItem ? getWarehouseItemIcon(matrixItem.iconItem, 14) : null
										return (
											<div key={matrixItem.id} className={styles.sectionMatrixCard}>
												<div className={styles.row}>
													<div className={styles.itemInfo}>
														<div className={styles.itemTitleRow}>
															{icon && (
																<span className={styles.itemIconBadge} aria-hidden="true">
																	<span className={styles.itemIcon}>{icon}</span>
																</span>
															)}
															<span className={styles.itemTitle}>{matrixItem.label}</span>
														</div>
														<div className={styles.itemDescription}>{matrixItem.description}</div>
													</div>
													{matrixItem.standaloneSectionItem ? (
														<div className={styles.controls}>
															<Button
																size="small"
																title="Decrease"
																onClick={() => updateCount(matrixItem.standaloneSectionItem!.key, -1)}
																disabled={(counts[matrixItem.standaloneSectionItem!.key] || 0) <= 0 || savingItem === matrixItem.standaloneSectionItem!.key}
															>
																-
															</Button>
															<input
																className={styles.countInput}
																type="number"
																min={0}
																step={1}
																inputMode="numeric"
																value={inputs[matrixItem.standaloneSectionItem.key] ?? String(counts[matrixItem.standaloneSectionItem.key] || 0)}
																disabled={savingItem === matrixItem.standaloneSectionItem.key}
																onInput={(event: any) => onInputChange(matrixItem.standaloneSectionItem!.key, event.target.value)}
																onBlur={() => onInputCommit(matrixItem.standaloneSectionItem!.key)}
																onKeyDown={(event: any) => {
																	if (event.key === 'Enter') {
																		event.preventDefault()
																		onInputCommit(matrixItem.standaloneSectionItem!.key)
																	}
																}}
															/>
															<Button
																size="small"
																title="Increase"
																onClick={() => updateCount(matrixItem.standaloneSectionItem!.key, 1)}
																disabled={savingItem === matrixItem.standaloneSectionItem!.key}
															>
																+
															</Button>
														</div>
													) : null}
												</div>

												{(Object.keys(matrixItem.sectionItemBySystemId).length > 0 || matrixItem.rows.length > 0) ? (
													<div className={styles.matrixTable}>
														<div
															className={styles.matrixHeader}
															style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}
														>
															<div className={styles.matrixLabel}><T>Item</T></div>
															{boxSystems.map((system, systemIndex) => (
																<div
																	key={`head-${matrixItem.id}-${system.id}`}
																	className={styles.matrixSystemHead}
																	style={getSystemThemeStyle(system.id, systemIndex)}
																>
																	{system.name}
																</div>
															))}
														</div>
															{Object.keys(matrixItem.sectionItemBySystemId).length > 0 ? (
																<div
																	className={styles.matrixRow}
																	style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}
																>
																	<div className={styles.matrixLabel}>
																		<div className={styles.matrixLabelBlock}>
																			<span className={styles.matrixLabelContent}>
																				{matrixItem.iconItem ? <span className={styles.matrixItemIcon} aria-hidden="true">{getWarehouseItemIcon(matrixItem.iconItem, 15)}</span> : null}
																				<span><T>Sections</T></span>
																			</span>
																			{(() => {
																				const colorSquares = buildSystemColorSquares(
																					boxSystems.map((system, idx) => {
																						const sectionItem = matrixItem.sectionItemBySystemId[system.id]
																						const palette = getSystemPaletteByIndex(idx)
																						return { count: sectionItem ? counts[sectionItem.key] || 0 : 0, color: palette.accent }
																					})
																				)
																				const total = boxSystems.reduce((sum, system) => {
																					const sectionItem = matrixItem.sectionItemBySystemId[system.id]
																					return sum + (sectionItem ? counts[sectionItem.key] || 0 : 0)
																				}, 0)
																				return (
																					<div className={styles.squareStack} title={`${Math.min(total, MAX_VISUAL_SQUARES)} / ${total}`}>
																						{colorSquares.map((color, sqIndex) => (
																							<span
																								key={`sections-${matrixItem.id}-sq-${sqIndex}`}
																								className={styles.square}
																								style={{ ...getSquareStyle(sqIndex), background: color }}
																							></span>
																						))}
																					</div>
																				)
																			})()}
																		</div>
																	</div>
																	{boxSystems.map((system, systemIndex) => {
																	const sectionItem = matrixItem.sectionItemBySystemId[system.id]
																	if (!sectionItem || linkedBoxSystemIds.has(system.id)) {
																		return <div key={`section-count-${matrixItem.id}-${system.id}`} className={styles.matrixEmpty}>-</div>
																	}
																	const count = counts[sectionItem.key] || 0
																	return (
																		<div
																			key={`section-count-${matrixItem.id}-${system.id}`}
																			className={styles.matrixCell}
																			style={getSystemThemeStyle(system.id, systemIndex)}
																		>
																			<Button
																				size="small"
																				title="Decrease"
																				onClick={() => updateCount(sectionItem.key, -1)}
																				disabled={count <= 0 || savingItem === sectionItem.key}
																			>
																				-
																			</Button>
																			<input
																				className={styles.countInput}
																				type="number"
																				min={0}
																				step={1}
																				inputMode="numeric"
																				value={inputs[sectionItem.key] ?? String(count)}
																				disabled={savingItem === sectionItem.key}
																				onInput={(event: any) => onInputChange(sectionItem.key, event.target.value)}
																				onBlur={() => onInputCommit(sectionItem.key)}
																				onKeyDown={(event: any) => {
																					if (event.key === 'Enter') {
																						event.preventDefault()
																						onInputCommit(sectionItem.key)
																					}
																				}}
																			/>
																			<Button
																				size="small"
																				title="Increase"
																				onClick={() => updateCount(sectionItem.key, 1)}
																				disabled={savingItem === sectionItem.key}
																			>
																				+
																			</Button>
																		</div>
																	)
																})}
															</div>
														) : null}
														{matrixItem.rows.map((frameRow) => (
															<div
																key={frameRow.id}
																className={styles.matrixRow}
																style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}
															>
																<div className={styles.matrixLabel}>
																	<div className={styles.matrixLabelBlock}>
																		<span className={styles.matrixLabelContent}>
																			{(() => {
																				const firstItem = Object.values(frameRow.itemsBySystemId)[0]
																				const frameIcon = firstItem ? getWarehouseItemIcon(firstItem, 15) : null
																				return frameIcon ? <span className={styles.matrixItemIcon} aria-hidden="true">{frameIcon}</span> : null
																			})()}
																			<span>{frameRow.label}</span>
																		</span>
																		{(() => {
																			const colorSquares = buildSystemColorSquares(
																				boxSystems.map((system, idx) => {
																					const rowItem = frameRow.itemsBySystemId[system.id]
																					const palette = getSystemPaletteByIndex(idx)
																					return { count: rowItem ? counts[rowItem.key] || 0 : 0, color: palette.accent }
																				})
																			)
																			const total = boxSystems.reduce((sum, system) => {
																				const rowItem = frameRow.itemsBySystemId[system.id]
																				return sum + (rowItem ? counts[rowItem.key] || 0 : 0)
																			}, 0)
																			return (
																				<div className={styles.squareStack} title={`${Math.min(total, MAX_VISUAL_SQUARES)} / ${total}`}>
																					{colorSquares.map((color, sqIndex) => (
																						<span
																							key={`${frameRow.id}-sq-${sqIndex}`}
																							className={styles.square}
																							style={{ ...getSquareStyle(sqIndex), background: color }}
																						></span>
																					))}
																				</div>
																			)
																		})()}
																	</div>
																</div>
																	{boxSystems.map((system, systemIndex) => {
																	const rowItem = frameRow.itemsBySystemId[system.id]
																	const frameModuleType = String(frameRow.id || '').split('::')[0]
																	const effectiveFrameSourceSystemId = resolveEffectiveFrameSourceSystemId(system.id, frameModuleType)
																if (!rowItem || effectiveFrameSourceSystemId !== system.id) {
																	return (
																		<div key={`${frameRow.id}-${system.id}`} className={styles.matrixEmpty}>
																			-
																		</div>
																	)
																}
																const count = counts[rowItem.key] || 0
																	return (
																		<div
																			key={`${frameRow.id}-${system.id}`}
																			className={styles.matrixCell}
																			style={getSystemThemeStyle(system.id, systemIndex)}
																		>
																		<Button
																			size="small"
																			title="Decrease"
																			onClick={() => updateCount(rowItem.key, -1)}
																			disabled={count <= 0 || savingItem === rowItem.key}
																		>
																			-
																		</Button>
																		<input
																			className={styles.countInput}
																			type="number"
																			min={0}
																			step={1}
																			inputMode="numeric"
																			value={inputs[rowItem.key] ?? String(count)}
																			disabled={savingItem === rowItem.key}
																			onInput={(event: any) => onInputChange(rowItem.key, event.target.value)}
																			onBlur={() => onInputCommit(rowItem.key)}
																			onKeyDown={(event: any) => {
																				if (event.key === 'Enter') {
																					event.preventDefault()
																					onInputCommit(rowItem.key)
																				}
																			}}
																		/>
																		<Button
																			size="small"
																			title="Increase"
																			onClick={() => updateCount(rowItem.key, 1)}
																			disabled={savingItem === rowItem.key}
																		>
																			+
																		</Button>
																	</div>
																)
															})}
														</div>
														))}
													</div>
												) : null}

											</div>
										)
									})
								) : group.id === 'HIVE_PARTS' ? (
									<>
										{group.items.some((item) => !!(item as PartMatrixRow).itemsBySystemId) ? (
											<div className={styles.sectionMatrixCard}>
												<div className={styles.matrixTable}>
													<div
														className={styles.matrixHeader}
														style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}
													>
														<div className={styles.matrixLabel}><T>Hive part</T></div>
															{boxSystems.map((system, systemIndex) => (
																<div
																	key={`head-part-group-${system.id}`}
																	className={styles.matrixSystemHead}
																	style={getSystemThemeStyle(system.id, systemIndex)}
																>
																	{system.name}
																</div>
															))}
													</div>
													{group.items
														.filter((item) => !!(item as PartMatrixRow).itemsBySystemId)
														.map((rawItem) => {
															const row = rawItem as PartMatrixRow
															return (
																	<div
																		key={row.id}
																		className={styles.matrixRow}
																		style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}
																	>
																		<div className={styles.matrixLabel}>
																			<div className={styles.matrixLabelBlock}>
																				<span className={styles.matrixLabelContent}>
																					{row.iconItem ? (
																						<span className={styles.matrixItemIcon} aria-hidden="true">
																							{getWarehouseItemIcon(row.iconItem, 15)}
																						</span>
																					) : null}
																					<span>{row.label}</span>
																				</span>
																				{(() => {
																					const colorSquares = buildSystemColorSquares(
																						boxSystems.map((system, idx) => {
																							const rowItem = row.itemsBySystemId[system.id]
																							const palette = getSystemPaletteByIndex(idx)
																							return { count: rowItem ? counts[rowItem.key] || 0 : 0, color: palette.accent }
																						})
																					)
																					const total = boxSystems.reduce((sum, system) => {
																						const rowItem = row.itemsBySystemId[system.id]
																						return sum + (rowItem ? counts[rowItem.key] || 0 : 0)
																					}, 0)
																					return (
																						<div className={styles.squareStack} title={`${Math.min(total, MAX_VISUAL_SQUARES)} / ${total}`}>
																							{colorSquares.map((color, sqIndex) => (
																								<span
																									key={`${row.id}-sq-${sqIndex}`}
																									className={styles.square}
																									style={{ ...getSquareStyle(sqIndex), background: color }}
																								></span>
																							))}
																						</div>
																					)
																				})()}
																			</div>
																		</div>
																		{boxSystems.map((system, systemIndex) => {
																			const rowItem = row.itemsBySystemId[system.id]
																		if (!rowItem || linkedBoxSystemIds.has(system.id)) {
																			return (
																				<div key={`${row.id}-${system.id}`} className={styles.matrixEmpty}>-</div>
																			)
																		}
																		const count = counts[rowItem.key] || 0
																			return (
																				<div
																					key={`${row.id}-${system.id}`}
																					className={styles.matrixCell}
																					style={getSystemThemeStyle(system.id, systemIndex)}
																				>
																				<Button
																					size="small"
																					title="Decrease"
																					onClick={() => updateCount(rowItem.key, -1)}
																					disabled={count <= 0 || savingItem === rowItem.key}
																				>
																					-
																				</Button>
																				<input
																					className={styles.countInput}
																					type="number"
																					min={0}
																					step={1}
																					inputMode="numeric"
																					value={inputs[rowItem.key] ?? String(count)}
																					disabled={savingItem === rowItem.key}
																					onInput={(event: any) => onInputChange(rowItem.key, event.target.value)}
																					onBlur={() => onInputCommit(rowItem.key)}
																					onKeyDown={(event: any) => {
																						if (event.key === 'Enter') {
																							event.preventDefault()
																							onInputCommit(rowItem.key)
																						}
																					}}
																				/>
																				<Button
																					size="small"
																					title="Increase"
																					onClick={() => updateCount(rowItem.key, 1)}
																					disabled={savingItem === rowItem.key}
																				>
																					+
																				</Button>
																			</div>
																		)
																	})}
																</div>
															)
														})}
												</div>
											</div>
										) : null}

										{group.items
											.filter((item) => !(item as PartMatrixRow).itemsBySystemId)
											.map((rawItem) => {
												const rowItem = rawItem as WarehouseInventoryItem
												const count = counts[rowItem.key] || 0
												const icon = getWarehouseItemIcon(rowItem, 14)
												const itemPath = `/warehouse/${encodeURIComponent(rowItem.key)}`
												return (
													<div className={styles.row} key={rowItem.key}>
														<div className={styles.itemInfo}>
															<div className={styles.itemTitleRow}>
																{icon && (
																	<span className={styles.itemIconBadge} aria-hidden="true">
																		<span className={styles.itemIcon}>{icon}</span>
																	</span>
																)}
																<Link to={itemPath} className={styles.itemTitleLink}>
																	<span className={styles.itemTitle}>{stripWarehouseSuffix(rowItem.title)}</span>
																</Link>
															</div>
															<div className={styles.itemDescription}>{rowItem.description}</div>
														</div>

														<div className={styles.controls}>
															<div className={styles.squareStack} title={`${Math.min(count, MAX_VISUAL_SQUARES)} / ${count}`}>
																{Array.from({
																	length: Math.min(count, MAX_VISUAL_SQUARES),
																}).map((_, sqIndex) => (
																	<span
																		key={`${rowItem.key}-sq-${sqIndex}`}
																		className={styles.square}
																		style={getSquareStyle(sqIndex)}
																	></span>
																))}
															</div>
															<Button
																size="small"
																title="Decrease"
																onClick={() => updateCount(rowItem.key, -1)}
																disabled={count <= 0 || savingItem === rowItem.key}
															>
																-
															</Button>
															<input
																className={styles.countInput}
																type="number"
																min={0}
																step={1}
																inputMode="numeric"
																value={inputs[rowItem.key] ?? String(count)}
																disabled={savingItem === rowItem.key}
																onInput={(event: any) => onInputChange(rowItem.key, event.target.value)}
																onBlur={() => onInputCommit(rowItem.key)}
																onKeyDown={(event: any) => {
																	if (event.key === 'Enter') {
																		event.preventDefault()
																		onInputCommit(rowItem.key)
																	}
																}}
															/>
															<Button
																size="small"
																title="Increase"
																onClick={() => updateCount(rowItem.key, 1)}
																disabled={savingItem === rowItem.key}
															>
																+
															</Button>
														</div>
													</div>
												)
											})}
										</>
								) : group.id === 'HORIZONTAL_HIVES' ? (
									group.items.map((matrixItem: SectionMatrix) => (
										<div key={matrixItem.id} className={styles.sectionMatrixCard}>
											<div className={styles.row}>
												<div className={styles.itemInfo}>
													<div className={styles.itemTitleRow}>
														{matrixItem.iconItem ? (
															<span className={styles.itemIconBadge} aria-hidden="true">
																<span className={styles.itemIcon}>{getWarehouseItemIcon(matrixItem.iconItem, 14)}</span>
															</span>
														) : null}
														<span className={styles.itemTitle}>{matrixItem.label}</span>
													</div>
													<div className={styles.itemDescription}>{matrixItem.description}</div>
												</div>
											</div>
											{matrixItem.rows.length > 0 ? (
												<div className={styles.matrixTable}>
													<div
														className={styles.matrixHeader}
														style={{ ['--system-column-count' as any]: '1' }}
													>
														<div className={styles.matrixLabel}><T>Item</T></div>
														<div className={styles.matrixSystemHead}><T>Count</T></div>
													</div>
													{matrixItem.rows.map((frameRow) => {
														const rowItems = Object.values(frameRow.itemsBySystemId)
														if (!rowItems.length) return null
														const count = rowItems.reduce((sum, item) => sum + (counts[item.key] || 0), 0)
														const iconItem = rowItems[0]
														return (
															<div
																key={frameRow.id}
																className={styles.matrixRow}
																style={{ ['--system-column-count' as any]: '1' }}
															>
																<div className={styles.matrixLabel}>
																	<div className={styles.matrixLabelBlock}>
																		<span className={styles.matrixLabelContent}>
																			<span className={styles.matrixItemIcon} aria-hidden="true">
																				{getWarehouseItemIcon(iconItem, 15)}
																			</span>
																			<span>{frameRow.label}</span>
																		</span>
																		<div className={styles.squareStack} title={`${Math.min(count, MAX_VISUAL_SQUARES)} / ${count}`}>
																			{Array.from({
																				length: Math.min(count, MAX_VISUAL_SQUARES),
																			}).map((_, sqIndex) => (
																				<span
																					key={`${frameRow.id}-sq-${sqIndex}`}
																					className={styles.square}
																					style={getSquareStyle(sqIndex)}
																				></span>
																			))}
																		</div>
																	</div>
																</div>
																<div className={styles.matrixCell}>
																	<Button
																		size="small"
																		title="Decrease"
																		onClick={() => updateHorizontalFrameRowCount(rowItems, -1)}
																		disabled={count <= 0}
																	>
																		-
																	</Button>
																	<input
																		className={styles.countInput}
																		type="text"
																		value={String(count)}
																		disabled
																	/>
																	<Button
																		size="small"
																		title="Increase"
																		onClick={() => updateHorizontalFrameRowCount(rowItems, 1)}
																	>
																		+
																	</Button>
																</div>
															</div>
														)
													})}
												</div>
											) : null}
										</div>
									))
								) : (
									group.items.map((rawItem) => {
										const rowItem = rawItem as WarehouseInventoryItem
									const count = counts[rowItem.key] || 0
									const icon = getWarehouseItemIcon(rowItem, 14)
									const itemPath = `/warehouse/${encodeURIComponent(rowItem.key)}`
									return (
										<div className={styles.row} key={rowItem.key}>
											<div className={styles.itemInfo}>
												<div className={styles.itemTitleRow}>
													{icon && (
														<span className={styles.itemIconBadge} aria-hidden="true">
															<span className={styles.itemIcon}>{icon}</span>
														</span>
													)}
													<Link to={itemPath} className={styles.itemTitleLink}>
														<span className={styles.itemTitle}>{stripWarehouseSuffix(rowItem.title)}</span>
													</Link>
												</div>
												<div className={styles.itemDescription}>{rowItem.description}</div>
											</div>

											<div className={styles.controls}>
												<div className={styles.squareStack} title={`${Math.min(count, MAX_VISUAL_SQUARES)} / ${count}`}>
													{Array.from({
														length: Math.min(count, MAX_VISUAL_SQUARES),
													}).map((_, sqIndex) => (
														<span
															key={`${rowItem.key}-sq-${sqIndex}`}
															className={styles.square}
															style={getSquareStyle(sqIndex)}
														></span>
													))}
												</div>
												<Button
													size="small"
													title="Decrease"
													onClick={() => updateCount(rowItem.key, -1)}
													disabled={count <= 0 || savingItem === rowItem.key}
												>
													-
												</Button>
												<input
													className={styles.countInput}
													type="number"
													min={0}
													step={1}
													inputMode="numeric"
													value={inputs[rowItem.key] ?? String(count)}
													disabled={savingItem === rowItem.key}
													onInput={(event: any) => onInputChange(rowItem.key, event.target.value)}
													onBlur={() => onInputCommit(rowItem.key)}
													onKeyDown={(event: any) => {
														if (event.key === 'Enter') {
															event.preventDefault()
															onInputCommit(rowItem.key)
														}
													}}
												/>
												<Button
													size="small"
													title="Increase"
													onClick={() => updateCount(rowItem.key, 1)}
													disabled={savingItem === rowItem.key}
												>
													+
												</Button>
											</div>
										</div>
									)
								})
							)}
						</div>
					</section>
				))}
			</div>
		</div>
	)
}
