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
	const [showSuccess, setShowSuccess] = useState(false);

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
		setShowSuccess(false);
	}

	async function onAlertConfigSave(e) {
		e.preventDefault();
		setSaving(true);
		await setAlertChannelConfig({ config: alertConfig });
		reexecuteQuery();
		setSaving(false);
		setShowSuccess(true);
		setTimeout(() => setShowSuccess(false), 2000);
	}

	if (!alertChannelData) {
		return <Loader />;
	}

	return (
		<PagePaddedCentered>
			{showSuccess && <MessageSuccess title={<T>Saved!</T>} message={<T>Alert channel settings saved successfully.</T>} />}
			<ErrorMsg error={mutationError || null} />

			<Card>
				<form onSubmit={onAlertConfigSave} className={styles.configForm}>
					<div className={styles.formRow}>
						<label htmlFor="phoneNumber" className={styles.configLabel}><T>Phone Number</T>:</label>
						<input
							className={`${styles.configInput} ${styles.phoneInput}`}
							id="phoneNumber"
							type="text"
							name="phoneNumber"
							value={alertConfig.phoneNumber}
							onChange={onAlertConfigChange}
							placeholder="+1234567890"
						/>
					</div>
					<div className={styles.formRow}>
						<label htmlFor="timeStart" className={styles.configLabel}><T>Time Window</T>:</label>
						<input
							className={`${styles.configInput} ${styles.timeInput}`}
							id="timeStart"
							type="time"
							name="timeStart"
							value={alertConfig.timeStart}
							onChange={onAlertConfigChange}
						/>
						<span className={styles.toText}><T>to</T></span>
						<input
							className={`${styles.configInput} ${styles.timeInput}`}
							id="timeEnd"
							type="time"
							name="timeEnd"
							value={alertConfig.timeEnd}
							onChange={onAlertConfigChange}
						/>
					</div>
					<div className={styles.formRow}>
						<input
							className={styles.checkboxInput}
							id="enabled"
							type="checkbox"
							name="enabled"
							checked={alertConfig.enabled}
							onChange={onAlertConfigChange}
						/>
						<label htmlFor="enabled" className={styles.configLabel} style={{ fontWeight: 500 }}><T>Enable SMS Alerts</T></label>
					</div>
					<div className={styles.buttonRow}>
						<Button type="submit" color="green" loading={saving}>
							<T>Save</T>
						</Button>
					</div>
				</form>
			</Card>
		</PagePaddedCentered>
	);
} 