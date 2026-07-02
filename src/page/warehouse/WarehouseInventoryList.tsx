import { Link } from 'react-router-dom'

import Button from '@/shared/button'
import T from '@/shared/translate'
import { getWarehouseItemIcon } from './iconMap'
import { stripWarehouseSuffix } from './labels'
import styles from './style.module.less'
import type { BoxSystem, CountHandlers, PartMatrixRow, SectionMatrix, WarehouseCounts, WarehouseGroup, WarehouseInventoryItem } from './types'
import {
	buildSystemColorSquares,
	getSquareStyle,
	getSystemPaletteByIndex,
	getSystemThemeStyle,
	MAX_VISUAL_SQUARES,
} from './helpers'

type WarehouseInventoryListProps = {
	groups: WarehouseGroup[]
	boxSystems: BoxSystem[]
	linkedBoxSystemIds: Set<string>
	counts: WarehouseCounts
	inputs: Record<string, string>
	savingItem: string | null
	decreaseTitle: string
	increaseTitle: string
	resolveEffectiveFrameSourceSystemId: (targetSystemId: string, moduleType: string) => string
	updateHorizontalFrameRowCount: (rowItems: WarehouseInventoryItem[], delta: number) => Promise<void>
} & CountHandlers

function SquareStack({ count, stackKey, colors }: { count: number; stackKey: string; colors?: string[] }) {
	const squares = colors || Array.from({ length: Math.min(count, MAX_VISUAL_SQUARES) }).map(() => '')
	return (
		<div className={styles.squareStack} title={`${Math.min(count, MAX_VISUAL_SQUARES)} / ${count}`}>
			{squares.map((color, sqIndex) => (
				<span
					key={`${stackKey}-sq-${sqIndex}`}
					className={styles.square}
					style={color ? { ...getSquareStyle(sqIndex), background: color } : getSquareStyle(sqIndex)}
				></span>
			))}
		</div>
	)
}

function MatrixHeader({ label, boxSystems }: { label: string; boxSystems: BoxSystem[] }) {
	return (
		<div
			className={styles.matrixHeader}
			style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}
		>
			<div className={styles.matrixLabel}><T>{label}</T></div>
			{boxSystems.map((system, systemIndex) => (
				<div
					key={`head-${label}-${system.id}`}
					className={styles.matrixSystemHead}
					style={getSystemThemeStyle(system.id, systemIndex)}
				>
					{system.name}
				</div>
			))}
		</div>
	)
}

function MatrixLabel({
	label,
	iconItem,
	count,
	stackKey,
	colors,
}: {
	label: string
	iconItem?: WarehouseInventoryItem
	count: number
	stackKey: string
	colors?: string[]
}) {
	return (
		<div className={styles.matrixLabel}>
			<div className={styles.matrixLabelBlock}>
				<span className={styles.matrixLabelContent}>
					{iconItem ? <span className={styles.matrixItemIcon} aria-hidden="true">{getWarehouseItemIcon(iconItem, 15)}</span> : null}
					<span><T>{label}</T></span>
				</span>
				<SquareStack count={count} stackKey={stackKey} colors={colors} />
			</div>
		</div>
	)
}

function CountControls({
	item,
	count,
	counts,
	inputs,
	savingItem,
	decreaseTitle,
	increaseTitle,
	updateCount,
	onInputChange,
	onInputCommit,
}: {
	item: WarehouseInventoryItem
	count: number
	counts: WarehouseCounts
	inputs: Record<string, string>
	savingItem: string | null
	decreaseTitle: string
	increaseTitle: string
} & CountHandlers) {
	return (
		<>
			<Button
				size="small"
				title={decreaseTitle}
				onClick={() => updateCount(item.key, -1)}
				disabled={count <= 0 || savingItem === item.key}
			>
				-
			</Button>
			<input
				className={styles.countInput}
				type="number"
				min={0}
				step={1}
				inputMode="numeric"
				value={inputs[item.key] ?? String(counts[item.key] || 0)}
				disabled={savingItem === item.key}
				onInput={(event: any) => onInputChange(item.key, event.target.value)}
				onBlur={() => onInputCommit(item.key)}
				onKeyDown={(event: any) => {
					if (event.key === 'Enter') {
						event.preventDefault()
						onInputCommit(item.key)
					}
				}}
			/>
			<Button
				size="small"
				title={increaseTitle}
				onClick={() => updateCount(item.key, 1)}
				disabled={savingItem === item.key}
			>
				+
			</Button>
		</>
	)
}

function InventoryItemRow(props: {
	item: WarehouseInventoryItem
	counts: WarehouseCounts
	inputs: Record<string, string>
	savingItem: string | null
	decreaseTitle: string
	increaseTitle: string
} & CountHandlers) {
	const { item, counts } = props
	const count = counts[item.key] || 0
	const icon = getWarehouseItemIcon(item, 14)
	const itemPath = `/warehouse/${encodeURIComponent(item.key)}`
	return (
		<div className={styles.row} key={item.key}>
			<div className={styles.itemInfo}>
				<div className={styles.itemTitleRow}>
					{icon && (
						<span className={styles.itemIconBadge} aria-hidden="true"><span className={styles.itemIcon}>{icon}</span></span>
					)}
					<Link to={itemPath} className={styles.itemTitleLink}>
						<span className={styles.itemTitle}><T>{stripWarehouseSuffix(item.title)}</T></span>
					</Link>
				</div>
				<div className={styles.itemDescription}><T>{item.description}</T></div>
			</div>

			<div className={styles.controls}>
				<SquareStack count={count} stackKey={item.key} />
				<CountControls {...props} count={count} />
			</div>
		</div>
	)
}

function EditableMatrixCell(props: {
	item: WarehouseInventoryItem
	count: number
	system: BoxSystem
	systemIndex: number
	counts: WarehouseCounts
	inputs: Record<string, string>
	savingItem: string | null
	decreaseTitle: string
	increaseTitle: string
} & CountHandlers) {
	return (
		<div className={styles.matrixCell} style={getSystemThemeStyle(props.system.id, props.systemIndex)}>
			<CountControls {...props} count={props.count} />
		</div>
	)
}

function colorsForSystems(
	boxSystems: BoxSystem[],
	counts: WarehouseCounts,
	getItem: (system: BoxSystem) => WarehouseInventoryItem | undefined
) {
	return buildSystemColorSquares(
		boxSystems.map((system, idx) => {
			const item = getItem(system)
			const palette = getSystemPaletteByIndex(idx)
			return { count: item ? counts[item.key] || 0 : 0, color: palette.accent }
		})
	)
}

function totalForSystems(
	boxSystems: BoxSystem[],
	counts: WarehouseCounts,
	getItem: (system: BoxSystem) => WarehouseInventoryItem | undefined
) {
	return boxSystems.reduce((sum, system) => {
		const item = getItem(system)
		return sum + (item ? counts[item.key] || 0 : 0)
	}, 0)
}

function HiveSectionsGroup(props: WarehouseInventoryListProps & { group: WarehouseGroup }) {
	return (
		<>
			{props.group.items.map((matrixItem: SectionMatrix) => {
				const icon = matrixItem.iconItem ? getWarehouseItemIcon(matrixItem.iconItem, 14) : null
				return (
					<div key={matrixItem.id} className={styles.sectionMatrixCard}>
						<div className={styles.row}>
							<div className={styles.itemInfo}>
								<div className={styles.itemTitleRow}>
									{icon && <span className={styles.itemIconBadge} aria-hidden="true"><span className={styles.itemIcon}>{icon}</span></span>}
									<span className={styles.itemTitle}><T>{matrixItem.id === 'DEEP' ? 'Nest sections' : matrixItem.label}</T></span>
								</div>
								<div className={styles.itemDescription}><T>{matrixItem.description}</T></div>
							</div>
							{matrixItem.standaloneSectionItem ? (
								<div className={styles.controls}>
									<CountControls {...props} item={matrixItem.standaloneSectionItem} count={props.counts[matrixItem.standaloneSectionItem.key] || 0} />
								</div>
							) : null}
						</div>

						{Object.keys(matrixItem.sectionItemBySystemId).length > 0 || matrixItem.rows.length > 0 ? (
							<div className={styles.matrixTable}>
								<MatrixHeader label="Item" boxSystems={props.boxSystems} />
								<SectionCountRow matrixItem={matrixItem} {...props} />
								<NucCountRow matrixItem={matrixItem} {...props} />
								{matrixItem.rows.map((frameRow) => <FrameMatrixRow key={frameRow.id} frameRow={frameRow} {...props} />)}
							</div>
						) : null}
					</div>
				)
			})}
		</>
	)
}

function SectionCountRow(props: WarehouseInventoryListProps & { matrixItem: SectionMatrix }) {
	const { matrixItem, boxSystems, counts, linkedBoxSystemIds } = props
	if (!Object.keys(matrixItem.sectionItemBySystemId).length) return null
	return (
		<div className={styles.matrixRow} style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}>
			<MatrixLabel
				label={matrixItem.id === 'DEEP' ? 'Deep sections' : 'Sections'}
				iconItem={matrixItem.iconItem}
				count={totalForSystems(boxSystems, counts, (system) => matrixItem.sectionItemBySystemId[system.id])}
				stackKey={`sections-${matrixItem.id}`}
				colors={colorsForSystems(boxSystems, counts, (system) => matrixItem.sectionItemBySystemId[system.id])}
			/>
			{boxSystems.map((system, systemIndex) => {
				const sectionItem = matrixItem.sectionItemBySystemId[system.id]
				if (!sectionItem || linkedBoxSystemIds.has(system.id)) return <div key={`section-count-${matrixItem.id}-${system.id}`} className={styles.matrixEmpty}>-</div>
				const count = counts[sectionItem.key] || 0
				return <EditableMatrixCell key={`section-count-${matrixItem.id}-${system.id}`} {...props} item={sectionItem} count={count} system={system} systemIndex={systemIndex} />
			})}
		</div>
	)
}

function NucCountRow(props: WarehouseInventoryListProps & { matrixItem: SectionMatrix }) {
	const { matrixItem, boxSystems, counts, linkedBoxSystemIds, resolveEffectiveFrameSourceSystemId } = props
	if (matrixItem.id !== 'DEEP' || !Object.keys(matrixItem.nucSectionItemBySystemId || {}).length) return null
	const nucSourceSystems = boxSystems.filter((system) => resolveEffectiveFrameSourceSystemId(system.id, 'DEEP') === system.id)
	return (
		<div className={styles.matrixRow} style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}>
			<MatrixLabel
				label="Nucs"
				iconItem={matrixItem.iconItem}
				count={totalForSystems(nucSourceSystems, counts, (system) => (matrixItem.nucSectionItemBySystemId || {})[system.id])}
				stackKey={`nucs-${matrixItem.id}`}
				colors={colorsForSystems(nucSourceSystems, counts, (system) => (matrixItem.nucSectionItemBySystemId || {})[system.id])}
			/>
			{boxSystems.map((system, systemIndex) => {
				const sourceId = resolveEffectiveFrameSourceSystemId(system.id, 'DEEP')
				const sectionItem = (matrixItem.nucSectionItemBySystemId || {})[sourceId]
				if (sourceId !== system.id || !sectionItem || linkedBoxSystemIds.has(system.id)) return <div key={`nucs-section-count-${matrixItem.id}-${system.id}`} className={styles.matrixEmpty}>-</div>
				const count = counts[sectionItem.key] || 0
				return <EditableMatrixCell key={`nucs-section-count-${matrixItem.id}-${system.id}`} {...props} item={sectionItem} count={count} system={system} systemIndex={systemIndex} />
			})}
		</div>
	)
}

function FrameMatrixRow(props: WarehouseInventoryListProps & { frameRow: SectionMatrix['rows'][number] }) {
	const { frameRow, boxSystems, counts, resolveEffectiveFrameSourceSystemId } = props
	const firstItem = Object.values(frameRow.itemsBySystemId)[0]
	const frameModuleType = String(frameRow.id || '').split('::')[0]
	return (
		<div className={styles.matrixRow} style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}>
			<MatrixLabel
				label={frameRow.label}
				iconItem={firstItem}
				count={totalForSystems(boxSystems, counts, (system) => frameRow.itemsBySystemId[system.id])}
				stackKey={frameRow.id}
				colors={colorsForSystems(boxSystems, counts, (system) => frameRow.itemsBySystemId[system.id])}
			/>
			{boxSystems.map((system, systemIndex) => {
				const rowItem = frameRow.itemsBySystemId[system.id]
				if (!rowItem || resolveEffectiveFrameSourceSystemId(system.id, frameModuleType) !== system.id) return <div key={`${frameRow.id}-${system.id}`} className={styles.matrixEmpty}>-</div>
				const count = counts[rowItem.key] || 0
				return <EditableMatrixCell key={`${frameRow.id}-${system.id}`} {...props} item={rowItem} count={count} system={system} systemIndex={systemIndex} />
			})}
		</div>
	)
}

function HivePartsGroup(props: WarehouseInventoryListProps & { group: WarehouseGroup }) {
	const matrixRows = props.group.items.filter((item) => !!(item as PartMatrixRow).itemsBySystemId) as PartMatrixRow[]
	const singles = props.group.items.filter((item) => !(item as PartMatrixRow).itemsBySystemId) as WarehouseInventoryItem[]
	return (
		<>
			{matrixRows.length ? (
				<div className={styles.sectionMatrixCard}>
					<div className={styles.matrixTable}>
						<MatrixHeader label="Hive part" boxSystems={props.boxSystems} />
						{matrixRows.map((row) => <PartMatrixRowView key={row.id} row={row} {...props} />)}
					</div>
				</div>
			) : null}
			{singles.map((item) => <InventoryItemRow key={item.key} item={item} {...props} />)}
		</>
	)
}

function PartMatrixRowView(props: WarehouseInventoryListProps & { row: PartMatrixRow }) {
	const { row, boxSystems, counts, linkedBoxSystemIds } = props
	return (
		<div className={styles.matrixRow} style={{ ['--system-column-count' as any]: String(Math.max(boxSystems.length, 1)) }}>
			<MatrixLabel
				label={row.label}
				iconItem={row.iconItem}
				count={totalForSystems(boxSystems, counts, (system) => row.itemsBySystemId[system.id])}
				stackKey={row.id}
				colors={colorsForSystems(boxSystems, counts, (system) => row.itemsBySystemId[system.id])}
			/>
			{boxSystems.map((system, systemIndex) => {
				const rowItem = row.itemsBySystemId[system.id]
				if (!rowItem || linkedBoxSystemIds.has(system.id)) return <div key={`${row.id}-${system.id}`} className={styles.matrixEmpty}>-</div>
				const count = counts[rowItem.key] || 0
				return <EditableMatrixCell key={`${row.id}-${system.id}`} {...props} item={rowItem} count={count} system={system} systemIndex={systemIndex} />
			})}
		</div>
	)
}

function HorizontalHivesGroup(props: WarehouseInventoryListProps & { group: WarehouseGroup }) {
	return (
		<>
			{props.group.items.map((matrixItem: SectionMatrix) => (
				<div key={matrixItem.id} className={styles.sectionMatrixCard}>
					<div className={styles.row}>
						<div className={styles.itemInfo}>
							<div className={styles.itemTitleRow}>
								{matrixItem.iconItem ? <span className={styles.itemIconBadge} aria-hidden="true"><span className={styles.itemIcon}>{getWarehouseItemIcon(matrixItem.iconItem, 14)}</span></span> : null}
								<span className={styles.itemTitle}><T>{matrixItem.label}</T></span>
							</div>
							<div className={styles.itemDescription}><T>{matrixItem.description}</T></div>
						</div>
					</div>
					{matrixItem.rows.length ? <HorizontalRows matrixItem={matrixItem} {...props} /> : null}
				</div>
			))}
		</>
	)
}

function HorizontalRows(props: WarehouseInventoryListProps & { matrixItem: SectionMatrix }) {
	return (
		<div className={styles.matrixTable}>
			<div className={styles.matrixHeader} style={{ ['--system-column-count' as any]: '1' }}>
				<div className={styles.matrixLabel}><T>Item</T></div>
				<div className={styles.matrixSystemHead}><T>Count</T></div>
			</div>
			{props.matrixItem.rows.map((frameRow) => <HorizontalRow key={frameRow.id} frameRow={frameRow} {...props} />)}
		</div>
	)
}

function HorizontalRow(props: WarehouseInventoryListProps & { frameRow: SectionMatrix['rows'][number] }) {
	const rowItems = Object.values(props.frameRow.itemsBySystemId)
	if (!rowItems.length) return null
	const count = rowItems.reduce((sum, item) => sum + (props.counts[item.key] || 0), 0)
	const iconItem = rowItems[0]
	return (
		<div className={styles.matrixRow} style={{ ['--system-column-count' as any]: '1' }}>
			<MatrixLabel label={props.frameRow.label} iconItem={iconItem} count={count} stackKey={props.frameRow.id} />
			<div className={styles.matrixCell}>
				<Button size="small" title={props.decreaseTitle} onClick={() => props.updateHorizontalFrameRowCount(rowItems, -1)} disabled={count <= 0}>-</Button>
				<input className={styles.countInput} type="text" value={String(count)} disabled />
				<Button size="small" title={props.increaseTitle} onClick={() => props.updateHorizontalFrameRowCount(rowItems, 1)}>+</Button>
			</div>
		</div>
	)
}

export default function WarehouseInventoryList(props: WarehouseInventoryListProps) {
	return (
		<div className={styles.list}>
			{props.groups.map((group) => (
				<section className={styles.group} key={group.id}>
					<div className={styles.groupItems}>
						{group.id === 'HIVE_SECTIONS' ? (
							<HiveSectionsGroup group={group} {...props} />
						) : group.id === 'HIVE_PARTS' ? (
							<HivePartsGroup group={group} {...props} />
						) : group.id === 'HORIZONTAL_HIVES' ? (
							<HorizontalHivesGroup group={group} {...props} />
						) : (
							group.items.map((item) => <InventoryItemRow key={(item as WarehouseInventoryItem).key} item={item as WarehouseInventoryItem} {...props} />)
						)}
					</div>
				</section>
			))}
		</div>
	)
}
