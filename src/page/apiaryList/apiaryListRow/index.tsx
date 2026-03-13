import React from 'react'

import Hive from '../../../shared/hive'
import Button from '../../../shared/button'
import HivesPlaceholder from '../../../shared/hivesPlaceholder'
import T from '../../../shared/translate'

import HiveIcon from '../../../icons/hive.tsx'

import styles from './index.module.less'
import BeeCounter from '../../../shared/beeCounter'
import { NavLink } from 'react-router-dom'
import Link from '../../../shared/link'
import ListIcon from '../../../icons/listIcon.tsx'
import TableIcon from '../../../icons/tableIcon.tsx'
import DateTimeAgo from '../../../shared/dateTimeAgo'
import { sortHives } from '../hiveSort'
import { getColonyStatusLabel, getHiveFamilies } from '../hivePresentation'

const COLUMN_CONFIG = [
	{
		key: 'HIVE_NUMBER',
		label: 'Hive #',
		translationContext: 'table header - hive number',
		sortable: true,
	},
	{
		key: 'QUEEN',
		label: 'Queen',
		translationContext: 'table header - queen name',
		sortable: true,
	},
	{
		key: 'QUEEN_YEAR',
		label: 'Queen year',
		translationContext: 'table header - queen year',
		sortable: true,
	},
	{
		key: 'QUEEN_RACE',
		label: 'Queen race',
		translationContext: 'table header - queen race',
		sortable: true,
	},
	{
		key: 'BEE_COUNT',
		label: 'Bee count',
		translationContext: 'table header of beekeeping app, start with uppercase latter',
		sortable: true,
	},
	{
		key: 'STATUS',
		label: 'Colony status',
		translationContext: 'table header of beekeeping app, this is a bee colony information, start with uppercase latter',
		sortable: true,
	},
	{
		key: 'LAST_TREATMENT',
		label: 'Last treatment',
		translationContext: 'table header of beekeeping app, this column is about anti-varroa mite treatment, in amount of days, start with uppercase latter',
		sortable: true,
	},
	{
		key: 'LAST_INSPECTION',
		label: 'Last inspection',
		translationContext: 'table header of beekeeping app, this column is about time when hive was checked, in amount of days, start with uppercase latter',
		sortable: true,
	},
]

export default function apiaryListRow({
	apiary,
	user,
	sortBy,
	sortOrder,
	onSortChange,
	visibleColumns,
	onToggleColumn,
	selectedHiveApiaryId,
	selectedHiveId,
	onSelectHive,
	onNavigateAcrossApiaries,
}) {

	const [listType, setListType] = React.useState(localStorage.getItem('apiaryListType.' + apiary.id) || 'list')
	const [columnsPopupOpen, setColumnsPopupOpen] = React.useState(false)
	const columnsPopupRef = React.useRef(null)
	const rowRef = React.useRef(null)
	const listItemRefs = React.useRef({})

	React.useEffect(() => {
		const handleClickOutside = (event) => {
			if (columnsPopupRef.current && !columnsPopupRef.current.contains(event.target)) {
				setColumnsPopupOpen(false)
			}
		}

		if (typeof window === 'undefined') {
			return () => { }
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const renderSortArrow = (column) => {
		if (sortBy !== column) {
			return ''
		}

		return sortOrder === 'ASC' ? '↑' : '↓'
	}

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

		return families
			.map((family) => family?.name || 'Unnamed')
			.join(', ')
	}

	const getQueenYearCellValue = (hive) => {
		const families = getHiveFamilies(hive)
		if (!families.length) {
			return '-'
		}

		return families
			.map((family) => family?.added)
			.filter(Boolean)
			.join(', ') || '-'
	}

	const getQueenRaceCellValue = (hive) => {
		const families = getHiveFamilies(hive)
		if (!families.length) {
			return '-'
		}

		return families
			.map((family) => family?.race)
			.filter(Boolean)
			.join(', ') || '-'
	}

	const sortedHives = React.useMemo(() => {
		if (!apiary?.hives) {
			return []
		}

		return sortHives(apiary.hives, sortBy, sortOrder)
	}, [apiary?.hives, sortBy, sortOrder])

	const renderSortableHeader = (column, translationContext, label) => (
		<th
			key={column}
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
			aria-sort={sortBy === column ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none'}
		>
			<T ctx={translationContext}>{label}</T> {renderSortArrow(column)}
		</th>
	)

	const isTypingTarget = (target) => {
		if (!target) return false
		const tagName = String(target.tagName || '').toLowerCase()
		return (
			target.isContentEditable ||
			tagName === 'input' ||
			tagName === 'textarea' ||
			tagName === 'select'
		)
	}

	const getItemByHiveId = React.useCallback((hiveId) => {
		return listItemRefs.current[hiveId] || null
	}, [])

	const focusHive = React.useCallback((hive) => {
		if (!hive) return
		onSelectHive(apiary.id, hive.id)

		const item = getItemByHiveId(hive.id)
		if (!item) return

		const link = item.querySelector('a')
		if (link) {
			link.focus()
		}

		item.scrollIntoView({ block: 'nearest', inline: 'nearest' })
	}, [apiary.id, getItemByHiveId, onSelectHive])

	const findNextListHive = React.useCallback((hives, currentIndex, direction) => {
		if (currentIndex < 0 || currentIndex >= hives.length) {
			return null
		}

		if (direction === 'left') {
			return hives[Math.max(0, currentIndex - 1)]
		}

		if (direction === 'right') {
			return hives[Math.min(hives.length - 1, currentIndex + 1)]
		}

		const positioned = hives
			.map((hive, index) => {
				const element = getItemByHiveId(hive.id)
				if (!element) return null
				const rect = element.getBoundingClientRect()
				return {
					hive,
					index,
					left: rect.left,
					top: rect.top,
					centerX: rect.left + rect.width / 2,
				}
			})
			.filter(Boolean)

		const current = positioned.find((entry) => entry.index === currentIndex)
		if (!current) return hives[currentIndex]

		const tolerance = 8
		const rows = []
		for (const entry of positioned) {
			const lastRow = rows[rows.length - 1]
			if (!lastRow || Math.abs(lastRow.top - entry.top) > tolerance) {
				rows.push({ top: entry.top, items: [entry] })
			} else {
				lastRow.items.push(entry)
			}
		}

		let rowIndex = -1
		for (let i = 0; i < rows.length; i += 1) {
			if (rows[i].items.some((item) => item.index === currentIndex)) {
				rowIndex = i
				break
			}
		}
		if (rowIndex === -1) return hives[currentIndex]

		const nextRowIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1
		if (nextRowIndex < 0 || nextRowIndex >= rows.length) {
			return hives[currentIndex]
		}

		const targetRowItems = rows[nextRowIndex].items
		let best = targetRowItems[0]
		for (const candidate of targetRowItems) {
			if (Math.abs(candidate.centerX - current.centerX) < Math.abs(best.centerX - current.centerX)) {
				best = candidate
			}
		}

		return best?.hive || hives[currentIndex]
	}, [getItemByHiveId])

	const moveToAdjacentApiary = React.useCallback((direction) => {
		onNavigateAcrossApiaries?.({
			apiaryId: apiary.id,
			direction,
		})
	}, [apiary.id, onNavigateAcrossApiaries])

	const onRowKeyDown = React.useCallback((event) => {
		if (columnsPopupOpen && columnsPopupRef.current?.contains(event.target)) {
			return
		}

		if (isTypingTarget(event.target)) {
			return
		}

		const key = event.key
		const canNavigateTable = listType === 'table' && (key === 'ArrowUp' || key === 'ArrowDown')
		const canNavigateList =
			listType === 'list' &&
			(key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight')

		if (!canNavigateTable && !canNavigateList) {
			return
		}

		if (!sortedHives?.length) {
			return
		}

		event.preventDefault()

		let currentIndex =
			selectedHiveApiaryId === apiary.id
				? sortedHives.findIndex((hive) => hive.id === selectedHiveId)
				: -1
		if (currentIndex === -1) {
			if (key === 'ArrowUp' || key === 'ArrowLeft') {
				focusHive(sortedHives[sortedHives.length - 1])
			} else {
				focusHive(sortedHives[0])
			}
			return
		}

		if (listType === 'table') {
			if (key === 'ArrowUp' && currentIndex === 0) {
				moveToAdjacentApiary('prev')
				return
			}
			if (key === 'ArrowDown' && currentIndex === sortedHives.length - 1) {
				moveToAdjacentApiary('next')
				return
			}

			const nextIndex = key === 'ArrowUp'
				? Math.max(0, currentIndex - 1)
				: Math.min(sortedHives.length - 1, currentIndex + 1)
			focusHive(sortedHives[nextIndex])
			return
		}

		if (listType === 'list') {
			const direction =
				key === 'ArrowUp' ? 'up'
					: key === 'ArrowDown' ? 'down'
						: key === 'ArrowLeft' ? 'left'
							: 'right'

			const nextHive = findNextListHive(sortedHives, currentIndex, direction)
			if (nextHive) {
				if (nextHive.id === sortedHives[currentIndex]?.id) {
					if (direction === 'up' || direction === 'left') {
						moveToAdjacentApiary('prev')
					} else {
						moveToAdjacentApiary('next')
					}
					return
				}

				focusHive(nextHive)
			}
		}
	}, [apiary.id, columnsPopupOpen, findNextListHive, focusHive, listType, moveToAdjacentApiary, selectedHiveApiaryId, selectedHiveId, sortedHives])

	React.useEffect(() => {
		const handleGlobalKeyDown = (event) => {
			const activeElement = document.activeElement
			if (!rowRef.current || !activeElement) {
				return
			}

			const isInsideApiaryBlock =
				activeElement === rowRef.current || rowRef.current.contains(activeElement)
			if (!isInsideApiaryBlock) {
				return
			}

			onRowKeyDown(event)
		}

		document.addEventListener('keydown', handleGlobalKeyDown, true)
		return () => {
			document.removeEventListener('keydown', handleGlobalKeyDown, true)
		}
	}, [onRowKeyDown])

	return (
		<div
			className={styles.apiary}
			ref={rowRef}
			tabIndex={0}
			data-apiary-keyboard-row="1"
			data-apiary-row-id={apiary.id}
		>
			<div className={styles.apiaryHead}>
				<h2><Link href={`/apiaries/${apiary.id}`}>{apiary.name ? apiary.name : '...'}</Link></h2>

				<div className={styles.buttons}>
					{listType == 'table' && apiary.hives.length > 0 && <Button onClick={() => {
						setListType('list')
						localStorage.setItem('apiaryListType.' + apiary.id, 'list')
					}}>
						<ListIcon />
					</Button>}

					{listType == 'list' && apiary.hives.length > 0 && <Button onClick={() => {
						setListType('table')
						localStorage.setItem('apiaryListType.' + apiary.id, 'table')
					}}>
						<TableIcon />
					</Button>}

					<Button href={`/apiaries/${apiary.id}/hives/add`}
						color={apiary.hives.length == 0 ? 'green' : 'white'}>
						<HiveIcon /><span><T ctx="button to add beehive">Add hive</T></span>
					</Button>
				</div>
			</div>

			<div className={styles.hives}>
				{apiary.hives && apiary.hives.length == 0 && <HivesPlaceholder />}
				{listType == 'list' && sortedHives &&
					sortedHives.map((hive, i) => (
						<div
							key={i}
							className={`${styles.hive} ${hive.status === 'collapsed' ? styles.collapsedHive : ''} ${hive.status === 'merged' ? styles.mergedHive : ''} ${selectedHiveApiaryId === apiary.id && selectedHiveId === hive.id ? styles.selectedHive : ''}`}
							data-hive-item="1"
							data-apiary-id={apiary.id}
							data-hive-id={hive.id}
							ref={(element) => {
								if (element) {
									listItemRefs.current[hive.id] = element
								} else {
									delete listItemRefs.current[hive.id]
								}
							}}
							onMouseEnter={() => onSelectHive(apiary.id, hive.id)}
							onClick={() => onSelectHive(apiary.id, hive.id)}
						>
							<NavLink to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
								<Hive boxes={hive.boxes} size={60} />
								<div className={styles.title}>
									{hive.hiveNumber && <span>#{hive.hiveNumber} </span>}
									{getHiveFamilies(hive)[0]?.name || hive.name || 'Unnamed'}
								</div>
							</NavLink>

							<BeeCounter count={hive.beeCount} />
						</div>
					))}

				{listType == 'table' && apiary.hives.length > 0 &&
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
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
														<span><T ctx={column.translationContext}>{column.label}</T></span>
													</label>
												))}
											</div>
										)}
									</div>
								</th>
								{COLUMN_CONFIG.filter(column => visibleColumns.includes(column.key)).map((column) => (
									column.sortable
										? renderSortableHeader(column.key, column.translationContext, column.label)
										: <th key={column.key}><T ctx={column.translationContext}>{column.label}</T></th>
								))}
							</tr>
						</thead>
						<tbody>
							{sortedHives &&
								sortedHives.map((hive, i) => (
									<tr
										key={i}
										className={selectedHiveApiaryId === apiary.id && selectedHiveId === hive.id ? styles.selectedHiveRow : ''}
										data-hive-item="1"
										data-apiary-id={apiary.id}
										data-hive-id={hive.id}
										ref={(element) => {
											if (element) {
												listItemRefs.current[hive.id] = element
											} else {
												delete listItemRefs.current[hive.id]
											}
										}}
										onMouseEnter={() => onSelectHive(apiary.id, hive.id)}
										onClick={() => onSelectHive(apiary.id, hive.id)}
									>
										{(() => {
											const displayStatus = getColonyStatusLabel(hive)
											const families = getHiveFamilies(hive)
											const primaryFamily = families[0]

											return (
												<>
										<td>
											<NavLink to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
												<Hive boxes={hive.boxes} size={20} />
											</NavLink>
										</td>
										{visibleColumns.includes('HIVE_NUMBER') && (
											<td>
												{hive.isNew && <span className={styles.newHive}><T ctx="new beehive">New</T></span>}
												{hive.hiveNumber || '-'}
											</td>
										)}
										{visibleColumns.includes('QUEEN') && (
											<td>
												<NavLink className={styles.title} to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
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
												{displayStatus
													? <span className={`${styles.statusPill} ${getStatusPillClassName(displayStatus)}`}>{displayStatus}</span>
													: '-'}
											</td>
										)}
										{visibleColumns.includes('LAST_TREATMENT') && (
											<td>
												{primaryFamily?.lastTreatment
													? <DateTimeAgo dateString={primaryFamily.lastTreatment} lang={user.lang} />
													: '-'}
											</td>
										)}
										{visibleColumns.includes('LAST_INSPECTION') && (
											<td>
												{hive?.lastInspection
													? <DateTimeAgo dateString={hive?.lastInspection} lang={user.lang} />
													: '-'}
											</td>
										)}
												</>
											)
										})()}
									</tr>
								))}
						</tbody>
					</table>
				}
			</div>
		</div>
	)
}
