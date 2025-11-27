import React, { useState } from 'react'
import { gql, useMutation, useQuery } from '@/api'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'
import styles from './styles.module.less'
import MessageSuccess from '@/shared/messageSuccess'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import Card from '@/shared/pagePaddedCentered/card'
import DateTimeFormat from '@/shared/dateTimeFormat'
import { Tab, TabBar } from '@/shared/tab'

const ALERT_CHANNELS_QUERY = gql`
	query alertChannels {
		alertChannels {
			id
			channelType
			phoneNumber
			email
			telegramUsername
			timeStart
			timeEnd
			enabled
		}
		alerts {
			id
			text
			date_added
			hiveId
			metricType
			metricValue
			delivered
		}
		alertRules {
			id
			hiveId
			apiaryId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
			createdAt
			updatedAt
		}
		apiaries {
			id
			name
			hives {
				id
				name
			}
		}
	}
`;

const CREATE_ALERT_RULE_MUTATION = gql`
	mutation createAlertRule($rule: AlertRuleInput!) {
		createAlertRule(rule: $rule) {
			id
			hiveId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
		}
	}
`;

const UPDATE_ALERT_RULE_MUTATION = gql`
	mutation updateAlertRule($id: ID!, $rule: AlertRuleInput!) {
		updateAlertRule(id: $id, rule: $rule) {
			id
			hiveId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
		}
	}
`;

const DELETE_ALERT_RULE_MUTATION = gql`
	mutation deleteAlertRule($id: ID!) {
		deleteAlertRule(id: $id)
	}
`;

const SET_ALERT_CHANNEL_MUTATION = gql`
	mutation setAlertChannel($config: AlertChannelInput!) {
		setAlertChannel(config: $config) {
			id
			channelType
			phoneNumber
			email
			telegramUsername
			timeStart
			timeEnd
			enabled
		}
	}
`;

const DELETE_ALERT_CHANNEL_MUTATION = gql`
	mutation deleteAlertChannel($channelType: String!) {
		deleteAlertChannel(channelType: $channelType)
	}
`;

function getChartTypeFromMetricType(metricType: string | null | undefined): string | null {
	if (!metricType) return null;

	const metricTypeMap: Record<string, string> = {
		'WEIGHT': 'weight',
		'TEMPERATURE': 'temperature',
		'ENTRANCE_MOVEMENT': 'entrance',
		'ENTRANCE_SPEED': 'entranceSpeed',
		'ENTRANCE_DETECTED': 'entranceDetected',
		'ENTRANCE_STATIONARY': 'entranceStationary',
		'ENTRANCE_INTERACTIONS': 'entranceInteractions'
	};

	return metricTypeMap[metricType] || null;
}

export default function AlertConfig() {
	const { data, reexecuteQuery } = useQuery(ALERT_CHANNELS_QUERY);
	const [setAlertChannel, { error: mutationError }] = useMutation(SET_ALERT_CHANNEL_MUTATION);
	const [deleteAlertChannel] = useMutation(DELETE_ALERT_CHANNEL_MUTATION);
	const [createAlertRule] = useMutation(CREATE_ALERT_RULE_MUTATION);
	const [updateAlertRule] = useMutation(UPDATE_ALERT_RULE_MUTATION);
	const [deleteAlertRule] = useMutation(DELETE_ALERT_RULE_MUTATION);

	const channels = data?.alertChannels || [];
	const alerts = data?.alerts || [];
	const alertRules = data?.alertRules || [];
	const apiaries = data?.apiaries || [];

	const hiveMap = React.useMemo(() => {
		const map: Record<string, { name: string; apiaryId: string; apiaryName: string }> = {};
		apiaries.forEach(apiary => {
			apiary.hives?.forEach(hive => {
				map[hive.id] = {
					name: hive.name || `Hive ${hive.id}`,
					apiaryId: apiary.id,
					apiaryName: apiary.name
				};
			});
		});
		return map;
	}, [apiaries]);

	const hasEnabledChannels = channels.some(ch => ch.enabled);
	const [activeTab, setActiveTab] = useState(hasEnabledChannels ? 'history' : 'channels');

	const [selectedChannel, setSelectedChannel] = useState('SMS');
	const [channelConfig, setChannelConfig] = useState({
		phoneNumber: '',
		email: '',
		telegramUsername: '',
		timeStart: '09:00',
		timeEnd: '22:00',
		enabled: true,
	});
	const [saving, setSaving] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);


	React.useEffect(() => {
		const existing = channels.find(ch => ch.channelType === selectedChannel);
		if (existing) {
			setChannelConfig({
				phoneNumber: existing.phoneNumber || '',
				email: existing.email || '',
				telegramUsername: existing.telegramUsername || '',
				timeStart: existing.timeStart || '09:00',
				timeEnd: existing.timeEnd || '22:00',
				enabled: existing.enabled !== false,
			});
		} else {
			setChannelConfig({
				phoneNumber: '',
				email: '',
				telegramUsername: '',
				timeStart: '09:00',
				timeEnd: '22:00',
				enabled: true,
			});
		}
	}, [selectedChannel, channels]);

	function onConfigChange(e) {
		const { name, value, type, checked } = e.target;
		setChannelConfig((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
		setShowSuccess(false);
	}

	async function onSave(e) {
		e.preventDefault();
		setSaving(true);
		await setAlertChannel({
			config: {
				channelType: selectedChannel,
				phoneNumber: selectedChannel === 'SMS' ? channelConfig.phoneNumber : null,
				email: selectedChannel === 'EMAIL' ? channelConfig.email : null,
				telegramUsername: selectedChannel === 'TELEGRAM' ? channelConfig.telegramUsername : null,
				timeStart: channelConfig.timeStart,
				timeEnd: channelConfig.timeEnd,
				enabled: channelConfig.enabled,
			}
		});
		reexecuteQuery();
		setSaving(false);
		setShowSuccess(true);
		setTimeout(() => setShowSuccess(false), 2000);
	}

	async function onDelete() {
		if (!confirm(`Delete ${selectedChannel} alert channel?`)) return;
		await deleteAlertChannel({ channelType: selectedChannel });
		reexecuteQuery();
	}

	if (!data) {
		return <Loader />;
	}

	const existingChannel = channels.find(ch => ch.channelType === selectedChannel);

	return (
		<PagePaddedCentered>
			{showSuccess && <MessageSuccess title={<T>Saved!</T>} message={<T>Alert channel settings saved successfully.</T>} />}
			<ErrorMsg error={mutationError || null} />

			<TabBar variant="rounded">
				<Tab variant="rounded" isSelected={activeTab === 'channels'} onClick={() => setActiveTab('channels')}>
					⚙️ <T>Alert Channels</T>
				</Tab>
				<Tab variant="rounded" isSelected={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
					📋 <T>Alert Rules</T>
				</Tab>
				<Tab variant="rounded" isSelected={activeTab === 'history'} onClick={() => setActiveTab('history')}>
					📜 <T>Alert History</T>
				</Tab>
			</TabBar>

			<Card style={{ borderTop: '1px solid #d0d0d0' }}>

				{activeTab === 'channels' && (
					<>
						<p style={{ color: '#666', margin: '16px 0' }}>
							<T>Configure how you want to receive alerts. You can enable multiple channels.</T>
						</p>

						<TabBar>
							<Tab isSelected={selectedChannel === 'SMS'} onClick={() => setSelectedChannel('SMS')}>
								📱 SMS
							</Tab>
							<Tab isSelected={selectedChannel === 'EMAIL'} onClick={() => setSelectedChannel('EMAIL')}>
								📧 Email
							</Tab>
							<Tab isSelected={selectedChannel === 'TELEGRAM'} onClick={() => setSelectedChannel('TELEGRAM')}>
								💬 Telegram
							</Tab>
						</TabBar>

				<form onSubmit={onSave} className={styles.configForm} style={{ marginTop: '16px' }}>
					{selectedChannel === 'SMS' && (
						<div className={styles.formRow}>
							<label htmlFor="phoneNumber" className={styles.configLabel}><T>Phone Number</T>:</label>
							<input
								className={`${styles.configInput} ${styles.phoneInput}`}
								id="phoneNumber"
								type="text"
								name="phoneNumber"
								value={channelConfig.phoneNumber}
								onChange={onConfigChange}
								placeholder="+1234567890"
								required
							/>
						</div>
					)}

					{selectedChannel === 'EMAIL' && (
						<div className={styles.formRow}>
							<label htmlFor="email" className={styles.configLabel}><T>Email Address</T>:</label>
							<input
								className={`${styles.configInput} ${styles.phoneInput}`}
								id="email"
								type="email"
								name="email"
								value={channelConfig.email}
								onChange={onConfigChange}
								placeholder="you@example.com"
								required
							/>
						</div>
					)}

					{selectedChannel === 'TELEGRAM' && (
						<div className={styles.formRow}>
							<label htmlFor="telegramUsername" className={styles.configLabel}><T>Telegram Username</T>:</label>
							<input
								className={`${styles.configInput} ${styles.phoneInput}`}
								id="telegramUsername"
								type="text"
								name="telegramUsername"
								value={channelConfig.telegramUsername}
								onChange={onConfigChange}
								placeholder="@username"
								required
							/>
						</div>
					)}

					<div className={styles.formRow}>
						<label htmlFor="timeStart" className={styles.configLabel}><T>Time Window</T>:</label>
						<input
							className={`${styles.configInput} ${styles.timeInput}`}
							id="timeStart"
							type="time"
							name="timeStart"
							value={channelConfig.timeStart}
							onChange={onConfigChange}
						/>
						<span className={styles.toText}><T>to</T></span>
						<input
							className={`${styles.configInput} ${styles.timeInput}`}
							id="timeEnd"
							type="time"
							name="timeEnd"
							value={channelConfig.timeEnd}
							onChange={onConfigChange}
						/>
					</div>

					<div className={styles.formRow}>
						<input
							className={styles.checkboxInput}
							id="enabled"
							type="checkbox"
							name="enabled"
							checked={channelConfig.enabled}
							onChange={onConfigChange}
						/>
						<label htmlFor="enabled" className={styles.configLabel} style={{ fontWeight: 500 }}>
							<T>{`Enable ${selectedChannel} Alerts`}</T>
						</label>
					</div>

					<div className={styles.buttonRow}>
						<Button type="submit" color="green" loading={saving}>
							<T>Save</T>
						</Button>
						{existingChannel && (
							<Button type="button" color="red" onClick={onDelete}>
								<T>Delete</T>
							</Button>
						)}
					</div>
				</form>
					</>
				)}

				{activeTab === 'history' && (
					<div style={{ padding: '16px' }}>
						{alerts.length === 0 ? (
							<p style={{ color: '#999' }}><T>No alerts yet</T></p>
						) : (
							<div className={styles.alertList}>
								{alerts.map((alert) => {
									const chartType = getChartTypeFromMetricType(alert.metricType);
									const timeViewUrl = alert.hiveId && chartType
										? `/time?hiveId=${alert.hiveId}&chartType=${chartType}&scrollTo=${chartType}`
										: null;

									return (
										<div key={alert.id} className={styles.alertItem}>
											<div className={styles.alertContent}>
												<div className={styles.alertText}>{alert.text}</div>
												{alert.hiveId && (
													<div className={styles.alertMeta}>
														Hive: {alert.hiveId} | {alert.metricType}: {alert.metricValue}
														{timeViewUrl && (
															<>
																{' | '}
																<a href={timeViewUrl} className={styles.viewChartLink}>
																	<T>View Chart</T> →
																</a>
															</>
														)}
													</div>
												)}
											</div>
											<div className={styles.alertTime}>
												<DateTimeFormat datetime={alert.date_added} />
												{alert.delivered && <span style={{ color: 'green', marginLeft: '8px' }}>✓</span>}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{activeTab === 'rules' && (
					<div style={{ padding: '16px' }}>
						<p style={{ color: '#666', marginBottom: '16px' }}>
							<T>Alert rules define when you should be notified about specific conditions in your hives.</T>
						</p>

						{alertRules.length === 0 ? (
							<p style={{ color: '#999' }}>
								<T>No alert rules configured yet. Alert rules are created from specific charts in the time view.</T>
							</p>
						) : (
							<div className={styles.alertList}>
								{alertRules.map((rule) => {
									const chartType = getChartTypeFromMetricType(rule.metricType);
									const hiveInfo = rule.hiveId ? hiveMap[rule.hiveId] : null;
									const apiary = rule.apiaryId ? apiaries.find(a => a.id === rule.apiaryId) : (hiveInfo ? apiaries.find(a => a.id === hiveInfo.apiaryId) : null);

									const timeViewUrl = chartType
										? rule.hiveId
											? `/time?hiveId=${rule.hiveId}&chartType=${chartType}&scrollTo=${chartType}`
											: rule.apiaryId
												? `/time?apiaryId=${rule.apiaryId}&chartType=${chartType}`
												: `/time?chartType=${chartType}`
										: null;

									const hiveViewUrl = hiveInfo
										? `/apiaries/${hiveInfo.apiaryId}/hives/${rule.hiveId}`
										: null;

									const apiaryViewUrl = apiary
										? `/apiaries/edit/${apiary.id}`
										: null;

									return (
										<div key={rule.id} className={styles.alertItem}>
											<div className={styles.alertContent}>
												<div className={styles.alertText}>
													<strong>{rule.metricType}</strong>
													{' '}
													{rule.conditionType === 'GREATER_THAN' && '>'}
													{rule.conditionType === 'LESS_THAN' && '<'}
													{rule.conditionType === 'EQUALS' && '='}
													{' '}
													{rule.thresholdValue}
													{rule.durationMinutes > 0 && ` for ${rule.durationMinutes} min`}
												</div>
												<div className={styles.alertMeta}>
													{rule.hiveId ? (
														hiveInfo ? (
															<>
																<a href={hiveViewUrl} className={styles.viewChartLink}>
																	{hiveInfo.name}
																</a>
																{' in '}
																{apiary && apiaryViewUrl ? (
																	<a href={apiaryViewUrl} className={styles.viewChartLink}>
																		{apiary.name}
																	</a>
																) : (
																	<span style={{ color: '#666' }}>{hiveInfo.apiaryName}</span>
																)}
															</>
														) : (
															<>Hive ID: {rule.hiveId}</>
														)
													) : apiary && apiaryViewUrl ? (
														<>
															All hives in{' '}
															<a href={apiaryViewUrl} className={styles.viewChartLink}>
																{apiary.name}
															</a>
														</>
													) : (
														<>All hives</>
													)}
													{' | '}
													<span style={{ color: rule.enabled ? 'green' : 'red' }}>
														{rule.enabled ? '✓ Enabled' : '✗ Disabled'}
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
														if (confirm('Delete this alert rule?')) {
															await deleteAlertRule({ id: rule.id });
															reexecuteQuery();
														}
													}}
													title="Delete rule"
												>
													🗑️
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</Card>
		</PagePaddedCentered>
	);
} 