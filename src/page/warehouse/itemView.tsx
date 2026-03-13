import { Link, useParams } from 'react-router-dom'

import { gql, useQuery } from '@/api'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { getWarehouseModuleById, isSupportedWarehouseModuleType } from './modules'
import styles from './style.module.less'

const WAREHOUSE_MODULE_STATS_QUERY = gql`
query warehouseModuleStats($moduleType: WarehouseModuleType!) {
	warehouseModuleStats(moduleType: $moduleType) {
		moduleType
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
	const module = getWarehouseModuleById(moduleType)
	const isSupportedType = isSupportedWarehouseModuleType(moduleType)
	const statsQueryType = isSupportedType ? moduleType : 'DEEP'

	const { data, loading, error } = useQuery(WAREHOUSE_MODULE_STATS_QUERY, {
		variables: {
			moduleType: statsQueryType,
		},
	})

	if (!module) {
		return (
			<div className={styles.page}>
				<h2><T>Warehouse item not found</T></h2>
				<Link to="/warehouse" className={styles.backLink}><T>Back to warehouse</T></Link>
			</div>
		)
	}

	if (loading && isSupportedType) {
		return <Loader />
	}

	const stats = isSupportedType ? data?.warehouseModuleStats : null

	return (
		<div className={styles.page}>
			<Link to="/warehouse" className={styles.backLink}><T>Back to warehouse</T></Link>
			<h2 className={styles.itemDetailTitle}><T>{module.label}</T></h2>
			<p className={styles.description}><T>{module.description}</T></p>
			<ErrorMsg error={error} />

			{!isSupportedType && (
				<div className={styles.topHivesEmpty}>
					<T>Detailed usage statistics are not available for this module type yet.</T>
				</div>
			)}

			{isSupportedType && (
				<>
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
										<li key={`${module.id}-hive-${hive.hiveId}`}>
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
				</>
			)}
		</div>
	)
}
