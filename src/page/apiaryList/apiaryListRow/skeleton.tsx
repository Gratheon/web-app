import React from 'react'

import styles from './index.module.less'
import skeleton from './skeleton.module.less'

function SkeletonLine({ className = '' }) {
	return <span className={`${skeleton.block} ${className}`.trim()} aria-hidden="true" />
}

function ListHiveSkeleton() {
	return (
		<div className={`${styles.hive} ${skeleton.hiveCard}`}>
			<div className={skeleton.hiveMeta}>
				<SkeletonLine className={skeleton.hiveTitle} />
			</div>
			<div className={skeleton.hiveGraphic}>
				<div className={skeleton.hiveOutline} aria-hidden="true">
					<span className={`${skeleton.outlinePart} ${skeleton.outlineRoof}`} />
					<span className={`${skeleton.outlinePart} ${skeleton.outlineBox}`} />
					<span className={`${skeleton.outlinePart} ${skeleton.outlineBox}`} />
					<span className={`${skeleton.outlinePart} ${skeleton.outlineBase}`} />
				</div>
			</div>
		</div>
	)
}

function TableCellSkeleton({ className = '' }) {
	return (
		<td>
			<SkeletonLine className={className || skeleton.tableCell} />
		</td>
	)
}

export default function ApiaryListRowSkeleton({
	listType = 'list',
	visibleColumns = [],
	showTypeIcon = true,
	hiveCount = 6,
	rowCount = 4,
}: {
	listType?: 'list' | 'table'
	visibleColumns?: string[]
	showTypeIcon?: boolean
	hiveCount?: number
	rowCount?: number
}) {
	const columns = visibleColumns.length > 0
		? visibleColumns
		: ['HIVE_NUMBER', 'QUEEN', 'BEE_COUNT', 'STATUS', 'BOX_SYSTEM', 'LAST_TREATMENT', 'LAST_INSPECTION']

	return (
		<div className={`${styles.apiary} ${skeleton.container}`} aria-hidden="true">
			<div className={styles.apiaryHead}>
				<h2 className={skeleton.heading}>
					{showTypeIcon && <span className={skeleton.typeIcon} />}
					<SkeletonLine className={skeleton.apiaryTitle} />
				</h2>

				<div className={styles.buttons}>
					<div className={skeleton.toolbar}>
						<span className={skeleton.button} />
						<SkeletonLine className={skeleton.actionButton} />
					</div>
				</div>
			</div>

			<div className={styles.hives}>
				{listType === 'table' ? (
					<table className={`${styles.hivesTable} ${skeleton.table}`}>
						<thead>
							<tr>
								<th className={styles.columnPickerCell}>
									<SkeletonLine className={skeleton.columnPicker} />
								</th>
								{columns.map((column) => (
									<th key={column}>
										<SkeletonLine className={skeleton.headerCell} />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: rowCount }).map((_, rowIndex) => (
								<tr key={rowIndex}>
									<td>
										<span className={skeleton.hiveCellIcon} />
									</td>
									{columns.map((column, columnIndex) => {
										if (column === 'STATUS') {
											return (
												<td key={`${column}-${columnIndex}`}>
													<SkeletonLine className={skeleton.statusPill} />
												</td>
											)
										}

										if (column === 'BOX_SYSTEM') {
											return (
												<td key={`${column}-${columnIndex}`}>
													<span className={skeleton.boxSystemCell}>
														<span className={skeleton.boxSystemDot} />
														<SkeletonLine className={skeleton.tableCell} />
													</span>
												</td>
											)
										}

										return (
											<TableCellSkeleton
												key={`${column}-${columnIndex}`}
												className={column === 'QUEEN' ? skeleton.tableCellWide : skeleton.tableCell}
											/>
										)
									})}
								</tr>
							))}
						</tbody>
					</table>
				) : (
						<>
							{Array.from({ length: hiveCount }).map((_, hiveIndex) => (
								<ListHiveSkeleton key={hiveIndex} />
							))}
						</>
					)}
				</div>
		</div>
	)
}
