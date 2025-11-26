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

export default function AlertConfig() {
	const { data, reexecuteQuery } = useQuery(ALERT_CHANNELS_QUERY);
	const [setAlertChannel, { error: mutationError }] = useMutation(SET_ALERT_CHANNEL_MUTATION);
	const [deleteAlertChannel] = useMutation(DELETE_ALERT_CHANNEL_MUTATION);

	const channels = data?.alertChannels || [];
	const alerts = data?.alerts || [];

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
								{alerts.map((alert) => (
									<div key={alert.id} className={styles.alertItem}>
										<div className={styles.alertContent}>
											<div className={styles.alertText}>{alert.text}</div>
											{alert.hiveId && (
												<div className={styles.alertMeta}>
													Hive: {alert.hiveId} | {alert.metricType}: {alert.metricValue}
												</div>
											)}
										</div>
										<div className={styles.alertTime}>
											<DateTimeFormat datetime={alert.date_added} />
											{alert.delivered && <span style={{ color: 'green', marginLeft: '8px' }}>✓</span>}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</Card>
		</PagePaddedCentered>
	);
} 