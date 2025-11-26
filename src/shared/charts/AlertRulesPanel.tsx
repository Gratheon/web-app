import React, { useState } from 'react'
import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import T from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import MessageSuccess from '@/shared/messageSuccess'
import styles from './AlertRulesPanel.module.less'

const ALERT_RULES_QUERY = gql`
	query alertRules($metricType: String!) {
		alertRules(metricType: $metricType) {
			id
			hiveId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
			createdAt
			updatedAt
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

interface AlertRulesPanelProps {
	metricType: string
	metricLabel: string
	hives: Array<{ id: string; name: string }>
}

export default function AlertRulesPanel({ metricType, metricLabel, hives }: AlertRulesPanelProps) {
	const { data, reexecuteQuery } = useQuery(ALERT_RULES_QUERY, { variables: { metricType } });
	const [createAlertRule, { error: createError }] = useMutation(CREATE_ALERT_RULE_MUTATION);
	const [updateAlertRule, { error: updateError }] = useMutation(UPDATE_ALERT_RULE_MUTATION);
	const [deleteAlertRule, { error: deleteError }] = useMutation(DELETE_ALERT_RULE_MUTATION);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [showSuccess, setShowSuccess] = useState(false);
	const [formData, setFormData] = useState({
		hiveId: '',
		conditionType: 'ABOVE',
		thresholdValue: 0,
		durationMinutes: 60,
		enabled: true
	});

	const alertRules = data?.alertRules || [];
	const error = createError || updateError || deleteError;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const target = e.target as HTMLInputElement | HTMLSelectElement;
		const { name, value } = target;
		const isNumber = (target as HTMLInputElement).type === 'number';
		const isCheckbox = (target as HTMLInputElement).type === 'checkbox';
		setFormData(prev => ({
			...prev,
			[name]: isCheckbox ? (target as HTMLInputElement).checked : (isNumber ? parseFloat(value) : value)
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editingId) {
				await updateAlertRule({
					id: editingId,
					rule: {
						hiveId: formData.hiveId || null,
						metricType,
						conditionType: formData.conditionType,
						thresholdValue: formData.thresholdValue,
						durationMinutes: formData.durationMinutes,
						enabled: formData.enabled
					}
				});
			} else {
				await createAlertRule({
					rule: {
						hiveId: formData.hiveId || null,
						metricType,
						conditionType: formData.conditionType,
						thresholdValue: formData.thresholdValue,
						durationMinutes: formData.durationMinutes,
						enabled: formData.enabled
					}
				});
			}
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 2000);
			reexecuteQuery();
			resetForm();
		} catch (e) {
			console.error('Failed to save alert rule:', e);
		}
	};

	const handleEdit = (rule: any) => {
		setEditingId(rule.id);
		setFormData({
			hiveId: rule.hiveId || '',
			conditionType: rule.conditionType,
			thresholdValue: rule.thresholdValue,
			durationMinutes: rule.durationMinutes,
			enabled: rule.enabled
		});
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Delete this alert rule?')) return;
		await deleteAlertRule({ id });
		reexecuteQuery();
	};

	const resetForm = () => {
		setEditingId(null);
		setFormData({
			hiveId: '',
			conditionType: 'ABOVE',
			thresholdValue: 0,
			durationMinutes: 60,
			enabled: true
		});
	};

	const getHiveName = (hiveId: string | null) => {
		if (!hiveId) return 'All hives';
		return hives.find(h => h.id === hiveId)?.name || hiveId;
	};

	const getConditionLabel = (conditionType: string) => {
		const labels = {
			ABOVE: 'Above',
			BELOW: 'Below',
			CHANGE_UP: 'Increases by',
			CHANGE_DOWN: 'Decreases by'
		};
		return labels[conditionType] || conditionType;
	};

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<h3><T>{`Alert Rules for ${metricLabel}`}</T></h3>
			</div>

			{showSuccess && <MessageSuccess title={<T>Success!</T>} message={<T>Alert rule saved</T>} />}
			<ErrorMsg error={error || null} />

			<div className={styles.content}>
				<div className={styles.existingRules}>
					{alertRules.length === 0 ? (
						<p style={{ color: '#999', fontStyle: 'italic' }}>
							<T>No alert rules yet. Create one below.</T>
						</p>
					) : (
						<div className={styles.rulesList}>
							{alertRules.map((rule) => (
								<div key={rule.id} className={styles.ruleItem}>
									<div className={styles.ruleInfo}>
										<div className={styles.ruleSummary}>
											<strong>{getHiveName(rule.hiveId)}</strong>
											<span className={styles.separator}>•</span>
											<span>{getConditionLabel(rule.conditionType)} {rule.thresholdValue}</span>
											<span className={styles.separator}>•</span>
											<span>{rule.durationMinutes} min</span>
											{!rule.enabled && <span className={styles.disabled}>(<T>Disabled</T>)</span>}
										</div>
									</div>
									<div className={styles.ruleActions}>
										<Button size="small" onClick={() => handleEdit(rule)}>
											✏️
										</Button>
										<Button size="small" color="red" onClick={() => handleDelete(rule.id)}>
											🗑️
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<form onSubmit={handleSubmit} className={styles.form}>
					<h4><T>{editingId ? 'Edit Alert Rule' : 'Create New Alert Rule'}</T></h4>

					<div className={styles.formGroup}>
						<label><T>Hive</T>:</label>
						<select
							name="hiveId"
							value={formData.hiveId}
							onChange={handleChange}
							className={styles.select}
						>
							<option value="">All hives</option>
							{hives.map(hive => (
								<option key={hive.id} value={hive.id}>{hive.name}</option>
							))}
						</select>
					</div>

					<div className={styles.formGroup}>
						<label><T>Condition</T>:</label>
						<select
							name="conditionType"
							value={formData.conditionType}
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
							value={formData.thresholdValue}
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
							value={formData.durationMinutes}
							onChange={handleChange}
							min="1"
							required
							className={styles.input}
						/>
						<small style={{ color: '#666', marginTop: '4px' }}>
							<T>Alert if condition persists for this duration</T>
						</small>
					</div>

					<div className={styles.formGroup}>
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<input
								type="checkbox"
								name="enabled"
								checked={formData.enabled}
								onChange={handleChange}
							/>
							<T>Enabled</T>
						</label>
					</div>

					<div className={styles.buttonRow}>
						{editingId && (
							<Button type="button" color="gray" onClick={resetForm}>
								<T>Cancel</T>
							</Button>
						)}
						<Button type="submit" color="green">
							<T>{editingId ? 'Update' : 'Create'}</T>
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

