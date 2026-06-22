import T from '@/shared/translate'
import styles from './styles.module.less'
import type { AlertRule, Apiary, HiveInfo } from './types'
import { getChartTypeFromMetricType } from './utils'

type Props = {
	alertRules: AlertRule[]
	hiveMap: Record<string, HiveInfo>
	apiaries: Apiary[]
	confirm: (message: string, options?: any) => Promise<boolean>
	deleteAlertRule: (variables: { id: string }) => Promise<unknown>
	reexecuteQuery: () => void
	inText: string
	forText: string
	minText: string
	hiveIdText: string
	allHivesInText: string
	allHivesText: string
	enabledText: string
	disabledText: string
	deleteRulePrompt: string
	deleteText: string
	deleteRuleTitle: string
}

export function RulesSection({
	alertRules,
	hiveMap,
	apiaries,
	confirm,
	deleteAlertRule,
	reexecuteQuery,
	inText,
	forText,
	minText,
	hiveIdText,
	allHivesInText,
	allHivesText,
	enabledText,
	disabledText,
	deleteRulePrompt,
	deleteText,
	deleteRuleTitle,
}: Props) {
	return (
		<div className={styles.panelSection}>
			<h2 className={styles.sectionTitle}>
				<T>Configure Alert Rules</T>
			</h2>
			<p style={{ color: '#666', marginBottom: '16px' }}>
				<T>
					Alert rules define when you should be notified about specific
					conditions in your hives.
				</T>
			</p>

			{alertRules.length === 0 ? (
				<p style={{ color: '#999' }}>
					<T>
						No alert rules configured yet. Alert rules are created from specific
						charts in the time view.
					</T>
				</p>
			) : (
				<div className={styles.alertList}>
					{alertRules.map((rule) => {
						const chartType = getChartTypeFromMetricType(rule.metricType)
						const hiveInfo = rule.hiveId ? hiveMap[rule.hiveId] : null
						const apiary = rule.apiaryId
							? apiaries.find((a) => a.id === rule.apiaryId)
							: hiveInfo
							? apiaries.find((a) => a.id === hiveInfo.apiaryId)
							: null

						const timeViewUrl = chartType
							? rule.hiveId
								? `/insights?hiveId=${rule.hiveId}&chartType=${chartType}&scrollTo=${chartType}`
								: rule.apiaryId
								? `/time?apiaryId=${rule.apiaryId}&chartType=${chartType}`
								: `/time?chartType=${chartType}`
							: null

						const hiveViewUrl = hiveInfo
							? `/apiaries/${hiveInfo.apiaryId}/hives/${rule.hiveId}`
							: null

						const apiaryViewUrl = apiary ? `/apiaries/${apiary.id}` : null

						return (
							<div key={rule.id} className={styles.alertItem}>
								<div className={styles.alertContent}>
									<div className={styles.alertText}>
										<strong>{rule.metricType}</strong>{' '}
										{rule.conditionType === 'GREATER_THAN' && '>'}
										{rule.conditionType === 'LESS_THAN' && '<'}
										{rule.conditionType === 'EQUALS' && '='}{' '}
										{rule.thresholdValue}
										{Number(rule.durationMinutes) > 0 &&
											` ${forText} ${rule.durationMinutes} ${minText}`}
									</div>
									<div className={styles.alertMeta}>
										{rule.hiveId ? (
											hiveInfo ? (
												<>
													<a
														href={hiveViewUrl}
														className={styles.viewChartLink}
													>
														{hiveInfo.name}
													</a>{' '}
													{inText}{' '}
													{apiary && apiaryViewUrl ? (
														<a
															href={apiaryViewUrl}
															className={styles.viewChartLink}
														>
															{apiary.name}
														</a>
													) : (
														<span style={{ color: '#666' }}>
															{hiveInfo.apiaryName}
														</span>
													)}
												</>
											) : (
												<>
													{hiveIdText}: {rule.hiveId}
												</>
											)
										) : apiary && apiaryViewUrl ? (
											<>
												{allHivesInText}{' '}
												<a
													href={apiaryViewUrl}
													className={styles.viewChartLink}
												>
													{apiary.name}
												</a>
											</>
										) : (
											<>{allHivesText}</>
										)}
										{' | '}
										<span style={{ color: rule.enabled ? 'green' : 'red' }}>
											{rule.enabled ? `✓ ${enabledText}` : `✗ ${disabledText}`}
										</span>
										{timeViewUrl && (
											<>
												{' | '}
												<a href={timeViewUrl} className={styles.viewChartLink}>
													<T>View Chart</T> →
												</a>
											</>
										)}
									</div>
								</div>
								<div className={styles.alertTime}>
									<button
										className={styles.deleteRuleBtn}
										onClick={async () => {
											const confirmed = await confirm(deleteRulePrompt, {
												confirmText: deleteText,
												isDangerous: true,
											})

											if (confirmed) {
												await deleteAlertRule({ id: rule.id })
												reexecuteQuery()
											}
										}}
										title={deleteRuleTitle}
									>
										🗑️
									</button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
