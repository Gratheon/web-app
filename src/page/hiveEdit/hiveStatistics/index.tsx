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

	const workerBeeCount = stats.workerBeeCount || 0
	const droneCount = stats.droneCount || 0
	const varroaCount = stats.varroaCount || 0
	const maxValue = Math.max(workerBeeCount, droneCount, varroaCount, 1)

	const statItems = [
		{
			id: 'worker',
			label: <T>Worker Bees</T>,
			value: workerBeeCount,
			colorClass: styles.workerBar,
		},
		{
			id: 'drone',
			label: <T>Drone Bees</T>,
			value: droneCount,
			colorClass: styles.droneBar,
		},
		{
			id: 'varroa',
			label: <T>Varroa Mites</T>,
			value: varroaCount,
			colorClass: styles.varroaBar,
		},
	]
	const visibleStatItems = statItems.filter((item) => item.value > 0)

	if (visibleStatItems.length === 0) {
		return null
	}

	return (
		<div className={styles.container}>
			<div className={styles.statsList}>
				{visibleStatItems.map((item) => (
					<div className={styles.statBlock} key={item.id}>
						<div className={styles.statLabel}>{item.label}</div>
						<div className={styles.statTrack}>
							<div
								className={`${styles.statFill} ${item.colorClass}`}
								style={{ width: `${(item.value / maxValue) * 100}%` }}
							>
								<span className={styles.statValue}>{item.value}</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
