import { useQuery } from '@/api'
import HIVE_STATISTICS_QUERY from '@/page/hiveEdit/_api/hiveStatisticsQuery.graphql.ts'
import T from '@/shared/translate'
import Loader from '@/shared/loader'
import styles from './hiveStatistics.module.less'

type HiveStatisticsProps = {
	hiveId: string
}

export default function HiveStatistics({ hiveId }: HiveStatisticsProps) {
	const { loading, error, data } = useQuery(HIVE_STATISTICS_QUERY, {
		variables: { hiveId },
	})

	if (loading) {
		return <Loader />
	}

	if (error) {
		return null
	}

	const stats = data?.hiveStatistics

	if (!stats) {
		return null
	}

	return (
		<div className={styles.container}>
			<h3 className={styles.title}><T>Hive Statistics</T></h3>
			<div className={styles.statsGrid}>
				<div className={styles.statItem}>
					<div className={styles.statLabel}><T>Worker Bees</T></div>
					<div className={styles.statValue}>{stats.workerBeeCount || 0}</div>
				</div>
				<div className={styles.statItem}>
					<div className={styles.statLabel}><T>Drone Bees</T></div>
					<div className={styles.statValue}>{stats.droneCount || 0}</div>
				</div>
				<div className={styles.statItem}>
					<div className={styles.statLabel}><T>Varroa Mites</T></div>
					<div className={styles.statValue}>{stats.varroaCount || 0}</div>
				</div>
			</div>
		</div>
	)
}

