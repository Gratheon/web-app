import DateTimeFormat from '@/shared/dateTimeFormat'
import T from '@/shared/translate'
import imageURL from '@/assets/alerts.webp'
import styles from './styles.module.less'
import type { AlertHistoryItem } from './types'
import { getChartTypeFromMetricType } from './utils'

type Props = {
	alerts: AlertHistoryItem[]
	alertsIllustrationAlt: string
	hiveLabel: string
}

export function HistorySection({
	alerts,
	alertsIllustrationAlt,
	hiveLabel,
}: Props) {
	return (
		<div className={styles.panelSection}>
			<h2 className={styles.sectionTitle}>
				<T>Alert History</T>
			</h2>
			{alerts.length === 0 ? (
				<div className={styles.historyPlaceholder}>
					<img
						className={styles.placeholderImage}
						src={imageURL}
						alt={alertsIllustrationAlt}
						draggable={false}
					/>
					<p>
						<T>No alerts yet</T>
					</p>
					<p className={styles.placeholderHint}>
						<T>Triggered alerts from your hives will appear here.</T>
					</p>
				</div>
			) : (
				<div className={styles.alertList}>
					{alerts.map((alert) => {
						const chartType = getChartTypeFromMetricType(alert.metricType)
						const timeViewUrl =
							alert.hiveId && chartType
								? `/time?hiveId=${alert.hiveId}&chartType=${chartType}&scrollTo=${chartType}`
								: null

						return (
							<div key={alert.id} className={styles.alertItem}>
								<div className={styles.alertContent}>
									<div className={styles.alertText}>{alert.text}</div>
									{alert.hiveId && (
										<div className={styles.alertMeta}>
											{hiveLabel}: {alert.hiveId} | {alert.metricType}:{' '}
											{alert.metricValue}
											{timeViewUrl && (
												<>
													{' | '}
													<a
														href={timeViewUrl}
														className={styles.viewChartLink}
													>
														<T>View Chart</T> →
													</a>
												</>
											)}
										</div>
									)}
								</div>
								<div className={styles.alertTime}>
									<DateTimeFormat datetime={alert.date_added} />
									{alert.delivered && (
										<span style={{ color: 'green', marginLeft: '8px' }}>✓</span>
									)}
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
