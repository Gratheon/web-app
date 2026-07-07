import Hive from '../../../shared/hive'
import T from '../../../shared/translate'
import BeeCounter from '../../../shared/beeCounter'
import DateTimeAgo from '../../../shared/dateTimeAgo'
import { NavLink } from 'react-router-dom'

import { getColonyStatusLabel, getHiveFamilies } from '../hivePresentation'
import { BOX_SYSTEM_COLORS, COLUMN_CONFIG } from './constants'
import styles from './index.module.less'

const getStatusPillClassName = (status) => {
	const normalizedStatus = String(status || '').toLowerCase()

	if (normalizedStatus === 'active') {
		return styles.statusPillGreen
	}

	if (normalizedStatus === 'collapsed' || normalizedStatus === 'dead') {
		return styles.statusPillRed
	}

	return styles.statusPillYellow
}

const getQueenCellValue = (hive) => {
	const families = getHiveFamilies(hive)
	if (!families.length) {
		return hive?.name || '-'
	}

	return families.map((family) => family?.name || 'Unnamed').join(', ')
}

const getQueenYearCellValue = (hive) => {
	const families = getHiveFamilies(hive)
	if (!families.length) {
		return '-'
	}

	return (
		families
			.map((family) => family?.added)
			.filter(Boolean)
			.join(', ') || '-'
	)
}

const getQueenRaceCellValue = (hive) => {
	const families = getHiveFamilies(hive)
	if (!families.length) {
		return '-'
	}

	return (
		families
			.map((family) => family?.race)
			.filter(Boolean)
			.join(', ') || '-'
	)
}

const getBoxSystemCellData = (hive, boxSystems) => {
	const isHorizontalHive = (hive?.boxes || []).some(
		(box) => box?.type === 'LARGE_HORIZONTAL_SECTION'
	)
	if (isHorizontalHive) {
		return {
			label: 'Independent',
			color: '#6b7280',
		}
	}

	const hiveBoxSystemId = hive?.boxSystemId ?? hive?.box_system_id
	const selectedSystem = (boxSystems || []).find(
		(system) => String(system.id) === String(hiveBoxSystemId)
	)
	const defaultSystem =
		(boxSystems || []).find((system) => system.isDefault) ||
		(boxSystems || [])[0]
	const system = selectedSystem || defaultSystem
	if (!system) {
		return {
			label: '-',
			color: '#6b7280',
		}
	}

	const systemIndex = Math.max(
		(boxSystems || []).findIndex(
			(entry) => String(entry.id) === String(system.id)
		),
		0
	)
	return {
		label: system.name,
		color: BOX_SYSTEM_COLORS[systemIndex % BOX_SYSTEM_COLORS.length],
	}
}

const renderSortArrow = (sortBy, sortOrder, column) => {
	if (sortBy !== column) {
		return ''
	}

	return sortOrder === 'ASC' ? '↑' : '↓'
}

function SortableHeader({
	column,
	label,
	onSortChange,
	sortBy,
	sortOrder,
	translationContext,
}) {
	return (
		<th
			className={styles.sortableHeader}
			onClick={() => onSortChange(column)}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					onSortChange(column)
				}
			}}
			role="button"
			tabIndex={0}
			aria-sort={
				sortBy === column
					? sortOrder === 'ASC'
						? 'ascending'
						: 'descending'
					: 'none'
			}
		>
			<T ctx={translationContext}>{label}</T>{' '}
			{renderSortArrow(sortBy, sortOrder, column)}
		</th>
	)
}

function BoxSystemBadge({ boxSystems, hive }) {
	const boxSystem = getBoxSystemCellData(hive, boxSystems)

	return (
		<span className={styles.boxSystemCell}>
			<span
				className={styles.boxSystemDot}
				style={{ backgroundColor: boxSystem.color }}
			></span>
			<span>{boxSystem.label}</span>
		</span>
	)
}

export default function HiveTableView({
	apiaryId,
	boxSystems,
	columnsPopupOpen,
	columnsPopupRef,
	dateTimeLang,
	onSelectHive,
	onSortChange,
	onToggleColumn,
	registerHiveItem,
	selectedHiveApiaryId,
	selectedHiveId,
	setColumnsPopupOpen,
	sortBy,
	sortedHives,
	sortOrder,
	visibleColumns,
}) {
	return (
		<table className={styles.hivesTable}>
			<thead>
				<tr>
					<th className={styles.columnPickerCell}>
						<div className={styles.columnPicker} ref={columnsPopupRef}>
							<button
								type="button"
								className={styles.columnPickerButton}
								onClick={() => setColumnsPopupOpen((prev) => !prev)}
								aria-label="Configure visible columns"
								title="Configure visible columns"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
								</svg>
							</button>
							{columnsPopupOpen && (
								<div className={styles.columnPickerPopup}>
									{COLUMN_CONFIG.map((column) => (
										<label key={column.key} className={styles.columnCheckbox}>
											<input
												type="checkbox"
												checked={visibleColumns.includes(column.key)}
												onChange={() => onToggleColumn(column.key)}
											/>
											<span>
												<T ctx={column.translationContext}>{column.label}</T>
											</span>
										</label>
									))}
								</div>
							)}
						</div>
					</th>
					{COLUMN_CONFIG.filter((column) =>
						visibleColumns.includes(column.key)
					).map((column) =>
						column.sortable ? (
							<SortableHeader
								key={column.key}
								column={column.key}
								translationContext={column.translationContext}
								label={column.label}
								onSortChange={onSortChange}
								sortBy={sortBy}
								sortOrder={sortOrder}
							/>
						) : (
							<th key={column.key}>
								<T ctx={column.translationContext}>{column.label}</T>
							</th>
						)
					)}
				</tr>
			</thead>
			<tbody>
				{sortedHives &&
					sortedHives.map((hive, i) => {
						const displayStatus = getColonyStatusLabel(hive)
						const families = getHiveFamilies(hive)
						const primaryFamily = families[0]

						return (
							<tr
								key={i}
								className={
									selectedHiveApiaryId === apiaryId &&
									selectedHiveId === hive.id
										? styles.selectedHiveRow
										: ''
								}
								data-hive-item="1"
								data-apiary-id={apiaryId}
								data-hive-id={hive.id}
								ref={(element) => registerHiveItem(hive.id, element)}
								onMouseEnter={() => onSelectHive(apiaryId, hive.id)}
								onClick={() => onSelectHive(apiaryId, hive.id)}
							>
								<td>
									<NavLink to={`/apiaries/${apiaryId}/hives/${hive.id}`}>
										<Hive
											boxes={hive.boxes}
											size={20}
											hiveType={hive.hiveType}
										/>
									</NavLink>
								</td>
								{visibleColumns.includes('HIVE_NUMBER') && (
									<td>
										{hive.isNew && (
											<span className={styles.newHive}>
												<T ctx="new beehive">New</T>
											</span>
										)}
										{hive.hiveNumber || '-'}
									</td>
								)}
								{visibleColumns.includes('QUEEN') && (
									<td>
										<NavLink
											className={styles.title}
											to={`/apiaries/${apiaryId}/hives/${hive.id}`}
										>
											{getQueenCellValue(hive)}
										</NavLink>
									</td>
								)}
								{visibleColumns.includes('QUEEN_YEAR') && (
									<td>{getQueenYearCellValue(hive)}</td>
								)}
								{visibleColumns.includes('QUEEN_RACE') && (
									<td>{getQueenRaceCellValue(hive)}</td>
								)}
								{visibleColumns.includes('BEE_COUNT') && (
									<td>
										<BeeCounter count={hive.beeCount} />
									</td>
								)}
								{visibleColumns.includes('STATUS') && (
									<td>
										{displayStatus ? (
											<span
												className={`${
													styles.statusPill
												} ${getStatusPillClassName(displayStatus)}`}
											>
												{displayStatus}
											</span>
										) : (
											'-'
										)}
									</td>
								)}
								{visibleColumns.includes('BOX_SYSTEM') && (
									<td>
										<BoxSystemBadge boxSystems={boxSystems} hive={hive} />
									</td>
								)}
								{visibleColumns.includes('LAST_TREATMENT') && (
									<td>
										{primaryFamily?.lastTreatment ? (
											<DateTimeAgo
												dateString={primaryFamily.lastTreatment}
												lang={dateTimeLang}
											/>
										) : (
											'-'
										)}
									</td>
								)}
								{visibleColumns.includes('LAST_INSPECTION') && (
									<td>
										{hive?.lastInspection ? (
											<DateTimeAgo
												dateString={hive?.lastInspection}
												lang={dateTimeLang}
											/>
										) : (
											'-'
										)}
									</td>
								)}
							</tr>
						)
					})}
			</tbody>
		</table>
	)
}
