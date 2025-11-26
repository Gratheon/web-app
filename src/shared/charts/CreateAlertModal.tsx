import React, { useState } from 'react'
import { gql, useMutation } from '@/api'
import Modal from '@/shared/modal'
import Button from '@/shared/button'
import T from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import MessageSuccess from '@/shared/messageSuccess'
import styles from './styles.module.less'

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

interface CreateAlertModalProps {
	isOpen: boolean
	onClose: () => void
	hiveId: string
	metricType: string
	metricLabel: string
	onSuccess?: () => void
}

export default function CreateAlertModal({
	isOpen,
	onClose,
	hiveId,
	metricType,
	metricLabel,
	onSuccess
}: CreateAlertModalProps) {
	const [createAlertRule, { error }] = useMutation(CREATE_ALERT_RULE_MUTATION);
	const [saving, setSaving] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [config, setConfig] = useState({
		conditionType: 'ABOVE',
		thresholdValue: 0,
		durationMinutes: 60,
		enabled: true
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const target = e.target as HTMLInputElement | HTMLSelectElement;
		const { name, value } = target;
		const isNumber = (target as HTMLInputElement).type === 'number';
		setConfig(prev => ({
			...prev,
			[name]: isNumber ? parseFloat(value) : value
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			await createAlertRule({
				rule: {
					hiveId,
					metricType,
					conditionType: config.conditionType,
					thresholdValue: config.thresholdValue,
					durationMinutes: config.durationMinutes,
					enabled: config.enabled
				}
			});
			setShowSuccess(true);
			setTimeout(() => {
				setShowSuccess(false);
				onSuccess?.();
				onClose();
			}, 1500);
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<Modal title={<T>Create Alert Rule</T>} onClose={onClose}>
			<div className={styles.modalContent}>
				<p style={{ color: '#666', marginBottom: '16px' }}>
					<T>{`Get notified when ${metricLabel} meets certain conditions`}</T>
				</p>

				{showSuccess && <MessageSuccess title={<T>Created!</T>} message={<T>Alert rule created successfully</T>} />}
				<ErrorMsg error={error || null} />

				<form onSubmit={handleSubmit} className={styles.alertForm}>
					<div className={styles.formGroup}>
						<label><T>Condition</T>:</label>
						<select
							name="conditionType"
							value={config.conditionType}
							onChange={handleChange}
							className={styles.select}
						>
							<option value="ABOVE">Above threshold</option>
							<option value="BELOW">Below threshold</option>
							<option value="CHANGE_UP">Increases by</option>
							<option value="CHANGE_DOWN">Decreases by</option>
						</select>
					</div>

					<div className={styles.formGroup}>
						<label><T>Threshold Value</T>:</label>
						<input
							type="number"
							name="thresholdValue"
							value={config.thresholdValue}
							onChange={handleChange}
							step="0.1"
							required
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label><T>Duration (minutes)</T>:</label>
						<input
							type="number"
							name="durationMinutes"
							value={config.durationMinutes}
							onChange={handleChange}
							min="1"
							required
							className={styles.input}
						/>
						<small style={{ color: '#666', marginTop: '4px' }}>
							<T>Alert if condition persists for this duration</T>
						</small>
					</div>

					<div className={styles.buttonRow}>
						<Button type="button" color="gray" onClick={onClose}>
							<T>Cancel</T>
						</Button>
						<Button type="submit" color="green" loading={saving}>
							<T>Create Alert</T>
						</Button>
					</div>
				</form>
			</div>
		</Modal>
	);
}

