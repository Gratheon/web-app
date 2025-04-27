import React, { useState } from 'react'
import { gql, useMutation, useQuery } from '@/api'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'
import styles from './styles.module.less'

const ALERT_CHANNEL_QUERY = gql`
	query alertChannelConfig {
		alertChannelConfig {
			channelType
			phoneNumber
			timeStart
			timeEnd
			enabled
		}
	}
`;

const SET_ALERT_CHANNEL_MUTATION = gql`
	mutation setAlertChannelConfig($config: AlertChannelConfigInput!) {
		setAlertChannelConfig(config: $config) {
			channelType
			phoneNumber
			timeStart
			timeEnd
			enabled
		}
	}
`;

export default function AlertConfig() {
	const { data: alertChannelData, reexecuteQuery } = useQuery(ALERT_CHANNEL_QUERY);
	const [setAlertChannelConfig, { error: mutationError }] = useMutation(SET_ALERT_CHANNEL_MUTATION);
	const [alertConfig, setAlertConfig] = useState({
		phoneNumber: '',
		timeStart: '09:00',
		timeEnd: '18:00',
		enabled: true,
	});
	const [saving, setSaving] = useState(false);

	React.useEffect(() => {
		if (alertChannelData?.alertChannelConfig) {
			setAlertConfig({
				phoneNumber: alertChannelData.alertChannelConfig.phoneNumber || '',
				timeStart: alertChannelData.alertChannelConfig.timeStart || '09:00',
				timeEnd: alertChannelData.alertChannelConfig.timeEnd || '18:00',
				enabled: alertChannelData.alertChannelConfig.enabled !== false,
			});
		}
	}, [alertChannelData]);

	function onAlertConfigChange(e) {
		const { name, value, type, checked } = e.target;
		setAlertConfig((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	}

	async function onAlertConfigSave(e) {
		e.preventDefault();
		setSaving(true);
		await setAlertChannelConfig({ config: alertConfig });
		reexecuteQuery();
		setSaving(false);
	}

	if (!alertChannelData) {
		return <Loader />;
	}

	return (
		<div className={styles.card}>
			<h2 className={styles.title}><T>Alert Channel Configuration</T></h2>
			<form onSubmit={onAlertConfigSave} className={styles.form}>
				<ErrorMsg error={mutationError || null} />
				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="phoneNumber">
						<T>Phone Number</T>:
					</label>
					<input
						className={styles.input}
						id="phoneNumber"
						type="text"
						name="phoneNumber"
						value={alertConfig.phoneNumber}
						onChange={onAlertConfigChange}
						placeholder="+1234567890"
					/>
				</div>
				<div className={styles.formGroup}>
					<label className={styles.label} htmlFor="timeStart">
						<T>Time Window</T>:
					</label>
					<input
						className={styles.input}
						id="timeStart"
						type="time"
						name="timeStart"
						value={alertConfig.timeStart}
						onChange={onAlertConfigChange}
					/>
					<span className={styles.toText}><T>to</T></span>
					<input
						className={styles.input}
						id="timeEnd"
						type="time"
						name="timeEnd"
						value={alertConfig.timeEnd}
						onChange={onAlertConfigChange}
					/>
				</div>
				<div className={styles.formGroupCheckbox}>
					<input
						className={styles.checkbox}
						id="enabled"
						type="checkbox"
						name="enabled"
						checked={alertConfig.enabled}
						onChange={onAlertConfigChange}
					/>
					<label className={styles.label} htmlFor="enabled">
						<T>Enable SMS Alerts</T>
					</label>
				</div>
				<div className={styles.buttonRow}>
					<Button type="submit" color="blue" loading={saving}>
						<T>Save SMS Alert Settings</T>
					</Button>
				</div>
			</form>
		</div>
	)
} 