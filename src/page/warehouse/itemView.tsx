import { Link, useParams } from 'react-router-dom'

import { gql, useQuery } from '@/api'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { getWarehouseItemIcon } from './iconMap'
import { stripWarehouseSuffix } from './labels'
import styles from './style.module.less'

const WAREHOUSE_ITEM_VIEW_QUERY = gql`
query warehouseItemView($itemKey: String!) {
	warehouseInventory {
		key
		kind
		groupKey
		title
		description
		moduleType
		frameSpec {
			id
			code
			frameType
			displayName
			systemId
		}
	}
	warehouseInventoryStats(itemKey: $itemKey) {
		key
		availableCount
		inUseCount
		totalCount
		topHives {
			hiveId
			hiveNumber
			apiaryId
			apiaryName
			count
		}
	}
}
`

export default function WarehouseItemViewPage() {
	const { moduleType } = useParams()
	const itemKey = moduleType ? decodeURIComponent(moduleType) : ''

	const { data, loading, error } = useQuery(WAREHOUSE_ITEM_VIEW_QUERY, {
		variables: { itemKey },
		pause: !itemKey,
	})

	if (!itemKey) {
		return (
			<div className={styles.page}>
				<h2><T>Warehouse item not found</T></h2>
				<Link to="/warehouse" className={styles.backLink}><T>Back to warehouse</T></Link>
			</div>
		)
	}

	if (loading) return <Loader />

	const item = (data?.warehouseInventory || []).find((row: any) => row.key === itemKey)
	const stats = data?.warehouseInventoryStats

	if (!item) {
		return (
			<div className={styles.page}>
				<h2><T>Warehouse item not found</T></h2>
				<Link to="/warehouse" className={styles.backLink}><T>Back to warehouse</T></Link>
			</div>
		)
	}

	const icon = getWarehouseItemIcon(item, 18)

	return (
		<div className={styles.page}>
			<Link to="/warehouse" className={styles.backLink}><T>Back to warehouse</T></Link>
			<h2 className={styles.itemDetailTitle}>
				<span className={styles.itemTitleRow}>
					{icon && (
						<span className={styles.itemIconBadge} aria-hidden="true">
							<span className={styles.itemIcon}>{icon}</span>
						</span>
					)}
					<span>{stripWarehouseSuffix(item.title)}</span>
				</span>
			</h2>
			<p className={styles.description}>{item.description}</p>
			<ErrorMsg error={error} />

			<div className={styles.detailCard}>
				<div className={styles.detailStats}>
					<div>
						<span className={styles.detailLabel}><T>In use in apiary</T>:</span>{' '}
						<span className={styles.detailValue}>{stats?.inUseCount ?? 0}</span>
					</div>
					<div>
						<span className={styles.detailLabel}><T>Available in warehouse</T>:</span>{' '}
						<span className={styles.detailValue}>{stats?.availableCount ?? 0}</span>
					</div>
					<div>
						<span className={styles.detailLabel}><T>Total known items</T>:</span>{' '}
						<span className={styles.detailValue}>{stats?.totalCount ?? 0}</span>
					</div>
				</div>
			</div>

			<div className={styles.detailCard}>
				<div className={styles.topHivesTitle}><T>Top 10 hives using this item</T></div>
				{!stats?.topHives?.length && (
					<div className={styles.topHivesEmpty}><T>No hives currently use this item.</T></div>
				)}
				{!!stats?.topHives?.length && (
					<ol className={styles.topHivesList}>
						{stats.topHives.map((hive: any) => {
							const hiveLabel = hive?.hiveNumber ? `#${hive.hiveNumber}` : `ID ${hive.hiveId}`
							const apiaryLabel = hive?.apiaryName ? ` (${hive.apiaryName})` : ''
							const canOpenHive = hive?.apiaryId && hive?.hiveId
							const hivePath = `/apiaries/${hive?.apiaryId}/hives/${hive?.hiveId}`

							return (
								<li key={`${item.key}-hive-${hive.hiveId}`}>
									{canOpenHive ? (
										<a href={hivePath} className={styles.topHiveLink}>
											<T>Hive</T> {hiveLabel}{apiaryLabel}
										</a>
									) : (
										<span><T>Hive</T> {hiveLabel}{apiaryLabel}</span>
									)}
									<span className={styles.topHiveCount}>
										{hive.count} <T>used</T>
									</span>
								</li>
							)
						})}
					</ol>
				)}
			</div>
		</div>
	)
}
