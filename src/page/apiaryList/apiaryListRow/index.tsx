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

export default function apiaryListRow({ apiary, user, sortBy, sortOrder, onSortChange, visibleColumns, onToggleColumn }) {

	const [listType, setListType] = React.useState(localStorage.getItem('apiaryListType.' + apiary.id) || 'list')
	const [columnsPopupOpen, setColumnsPopupOpen] = React.useState(false)
	const columnsPopupRef = React.useRef(null)

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

	const getSortValue = (hive, column) => {
		switch (column) {
		case 'HIVE_NUMBER':
			return hive?.hiveNumber ?? null
		case 'QUEEN':
			return hive?.family?.name || hive?.name || ''
		case 'BEE_COUNT':
			return hive?.beeCount ?? null
		case 'STATUS':
			return hive?.status ?? ''
		case 'LAST_TREATMENT':
			return hive?.family?.lastTreatment ? new Date(hive.family.lastTreatment).getTime() : null
		case 'LAST_INSPECTION':
			return hive?.lastInspection ? new Date(hive.lastInspection).getTime() : null
		case 'QUEEN_YEAR':
			return hive?.family?.added ? Number.parseInt(hive.family.added, 10) : null
		case 'QUEEN_RACE':
			return hive?.family?.race ?? ''
		default:
			return null
		}
	}

	const sortedHives = React.useMemo(() => {
		if (!apiary?.hives) {
			return []
		}

		const sorted = [...apiary.hives]
		sorted.sort((hiveA, hiveB) => {
			const aValue = getSortValue(hiveA, sortBy)
			const bValue = getSortValue(hiveB, sortBy)
			const hasA = aValue !== null && aValue !== undefined && aValue !== ''
			const hasB = bValue !== null && bValue !== undefined && bValue !== ''

			if (!hasA && !hasB) {
				return 0
			}
			if (!hasA) {
				return 1
			}
			if (!hasB) {
				return -1
			}

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue
			}

			const compareValue = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' })
			return sortOrder === 'ASC' ? compareValue : -compareValue
		})

		return sorted
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

	return (
		<div className={styles.apiary}>
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
				{listType == 'list' && apiary.hives &&
					apiary.hives.map((hive, i) => (
						<div key={i} className={`${styles.hive} ${hive.status === 'collapsed' ? styles.collapsedHive : ''} ${hive.status === 'merged' ? styles.mergedHive : ''}`}>
							<NavLink to={`/apiaries/${apiary.id}/hives/${hive.id}`}>
								<Hive boxes={hive.boxes} size={60} />
								<div className={styles.title}>
									{hive.hiveNumber && <span>#{hive.hiveNumber} </span>}
									{hive?.family?.name || hive.name || 'Unnamed'}
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
									<tr key={i}>
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
													{hive?.family?.name || hive.name || '-'}
												</NavLink>
											</td>
										)}
										{visibleColumns.includes('QUEEN_YEAR') && (
											<td>{hive?.family?.added || '-'}</td>
										)}
										{visibleColumns.includes('QUEEN_RACE') && (
											<td>{hive?.family?.race || '-'}</td>
										)}
										{visibleColumns.includes('BEE_COUNT') && (
											<td>
												<BeeCounter count={hive.beeCount} />
											</td>
										)}
										{visibleColumns.includes('STATUS') && (
											<td>
												{hive.status
													? <span className={`${styles.statusPill} ${getStatusPillClassName(hive.status)}`}>{hive.status}</span>
													: '-'}
											</td>
										)}
										{visibleColumns.includes('LAST_TREATMENT') && (
											<td>
												{hive?.family?.lastTreatment
													? <DateTimeAgo dateString={hive?.family?.lastTreatment} lang={user.lang} />
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
									</tr>
								))}
						</tbody>
					</table>
				}
			</div>
		</div>
	)
}
