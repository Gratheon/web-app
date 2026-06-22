import React, { useState } from 'react'
import { useMutation, useQuery } from '@/api'
import { useConfirm } from '@/hooks/useConfirm'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import T, { useTranslation as t } from '@/shared/translate'
import styles from './styles.module.less'
import MessageSuccess from '@/shared/messageSuccess'
import { ChannelsSection } from './ChannelsSection'
import { HistorySection } from './HistorySection'
import { RulesSection } from './RulesSection'
import {
	ALERT_CHANNELS_QUERY,
	ALERTS_SERVICE_LIVENESS_QUERY,
	CREATE_ALERT_RULE_MUTATION,
	DELETE_ALERT_CHANNEL_MUTATION,
	DELETE_ALERT_RULE_MUTATION,
	SET_ALERT_CHANNEL_MUTATION,
	UPDATE_ALERT_RULE_MUTATION,
} from './graphql'
import type {
	AlertChannelConfig,
	AlertChannelType,
	AlertConfigSection,
} from './types'

const DEFAULT_CHANNEL_CONFIG: AlertChannelConfig = {
	phoneNumber: '',
	email: '',
	telegramUsername: '',
	timeStart: '09:00',
	timeEnd: '22:00',
	enabled: true,
}

export default function AlertConfig({
	section = 'history',
}: {
	section?: AlertConfigSection
}) {
	const { confirm, ConfirmDialog } = useConfirm()
	const { data: alertsServiceLiveness, error: alertsServiceError } = useQuery(
		ALERTS_SERVICE_LIVENESS_QUERY
	)
	const {
		data,
		error: pageQueryError,
		reexecuteQuery,
	} = useQuery(ALERT_CHANNELS_QUERY)
	const [setAlertChannel, { error: mutationError }] = useMutation(
		SET_ALERT_CHANNEL_MUTATION
	)
	const [deleteAlertChannel] = useMutation(DELETE_ALERT_CHANNEL_MUTATION)
	const [createAlertRule] = useMutation(CREATE_ALERT_RULE_MUTATION)
	const [updateAlertRule] = useMutation(UPDATE_ALERT_RULE_MUTATION)
	const [deleteAlertRule] = useMutation(DELETE_ALERT_RULE_MUTATION)

	const channels = data?.alertChannels || []
	const alerts = data?.alerts || []
	const alertRules = data?.alertRules || []
	const apiaries = data?.apiaries || []

	const hiveMap = React.useMemo(() => {
		const map: Record<
			string,
			{ name: string; apiaryId: string; apiaryName: string }
		> = {}
		apiaries.forEach((apiary) => {
			apiary.hives?.forEach((hive) => {
				map[hive.id] = {
					name: hive.hiveNumber
						? `Hive #${hive.hiveNumber}`
						: `Hive ${hive.id}`,
					apiaryId: apiary.id,
					apiaryName: apiary.name,
				}
			})
		})
		return map
	}, [apiaries])

	const [selectedChannel, setSelectedChannel] =
		useState<AlertChannelType>('SMS')
	const [channelConfig, setChannelConfig] = useState(DEFAULT_CHANNEL_CONFIG)
	const [saving, setSaving] = useState(false)
	const [showSuccess, setShowSuccess] = useState(false)
	const inText = t('in')
	const forText = t('for')
	const minText = t('min')
	const hiveIdText = t('Hive ID')
	const allHivesInText = t('All hives in')
	const allHivesText = t('All hives')
	const enabledText = t('Enabled')
	const disabledText = t('Disabled')
	const deleteRulePrompt = t('Delete this alert rule?')
	const deleteText = t('Delete')
	const deleteRuleTitle = t('Delete rule')
	const alertsIllustrationAlt = t('Alerts illustration')
	const hiveLabel = t('Hive')
	const smsLabel = t('SMS')
	const emailLabel = t('Email')
	const telegramLabel = t('Telegram')
	const deleteSmsAlertChannelPrompt = t('Delete SMS alert channel?')
	const deleteEmailAlertChannelPrompt = t('Delete Email alert channel?')
	const deleteTelegramAlertChannelPrompt = t('Delete Telegram alert channel?')
	const enableSmsAlertsText = t('Enable SMS Alerts')
	const enableEmailAlertsText = t('Enable Email Alerts')
	const enableTelegramAlertsText = t('Enable Telegram Alerts')

	React.useEffect(() => {
		const existing = channels.find((ch) => ch.channelType === selectedChannel)
		if (existing) {
			setChannelConfig({
				phoneNumber: existing.phoneNumber || '',
				email: existing.email || '',
				telegramUsername: existing.telegramUsername || '',
				timeStart: existing.timeStart || '09:00',
				timeEnd: existing.timeEnd || '22:00',
				enabled: existing.enabled !== false,
			})
		} else {
			setChannelConfig(DEFAULT_CHANNEL_CONFIG)
		}
	}, [selectedChannel, channels])

	function onConfigChange(e) {
		const { name, value, type, checked } = e.target
		setChannelConfig((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}))
		setShowSuccess(false)
	}

	async function onSave(e) {
		e.preventDefault()
		setSaving(true)
		await setAlertChannel({
			config: {
				channelType: selectedChannel,
				phoneNumber:
					selectedChannel === 'SMS' ? channelConfig.phoneNumber : null,
				email: selectedChannel === 'EMAIL' ? channelConfig.email : null,
				telegramUsername:
					selectedChannel === 'TELEGRAM'
						? channelConfig.telegramUsername
						: null,
				timeStart: channelConfig.timeStart,
				timeEnd: channelConfig.timeEnd,
				enabled: channelConfig.enabled,
			},
		})
		reexecuteQuery()
		setSaving(false)
		setShowSuccess(true)
		setTimeout(() => setShowSuccess(false), 2000)
	}

	async function onDelete() {
		const deleteChannelPrompt =
			selectedChannel === 'SMS'
				? deleteSmsAlertChannelPrompt
				: selectedChannel === 'EMAIL'
				? deleteEmailAlertChannelPrompt
				: deleteTelegramAlertChannelPrompt

		const confirmed = await confirm(deleteChannelPrompt, {
			confirmText: deleteText,
			isDangerous: true,
		})

		if (!confirmed) return
		await deleteAlertChannel({ channelType: selectedChannel })
		reexecuteQuery()
	}

	if (!alertsServiceLiveness && !alertsServiceError) {
		return <Loader />
	}

	if (alertsServiceError) {
		return (
			<div className={styles.page}>
				<ErrorMsg error={alertsServiceError} />
				<div className={styles.serviceErrorInfo}>
					<p>
						<T>Alerts service is currently unavailable.</T>
					</p>
					<p>
						<T>
							Configuring alert channels and listing alerts is temporarily not
							possible.
						</T>
					</p>
				</div>
			</div>
		)
	}

	if (!data && !pageQueryError) {
		return <Loader />
	}

	if (!data && pageQueryError) {
		return (
			<div className={styles.page}>
				<ErrorMsg error={pageQueryError} />
			</div>
		)
	}

	const existingChannel = channels.find(
		(ch) => ch.channelType === selectedChannel
	)
	const enableChannelAlertsLabel =
		selectedChannel === 'SMS'
			? enableSmsAlertsText
			: selectedChannel === 'EMAIL'
			? enableEmailAlertsText
			: enableTelegramAlertsText

	return (
		<div className={styles.page}>
			{showSuccess && (
				<MessageSuccess
					title={<T>Saved!</T>}
					message={<T>Alert channel settings saved successfully.</T>}
				/>
			)}
			<ErrorMsg error={pageQueryError || mutationError || null} />

			<div>
				{section === 'channels' && (
					<ChannelsSection
						selectedChannel={selectedChannel}
						setSelectedChannel={setSelectedChannel}
						channelConfig={channelConfig}
						onConfigChange={onConfigChange}
						onSave={onSave}
						onDelete={onDelete}
						existingChannel={existingChannel}
						saving={saving}
						enableChannelAlertsLabel={enableChannelAlertsLabel}
						smsLabel={smsLabel}
						emailLabel={emailLabel}
						telegramLabel={telegramLabel}
					/>
				)}

				{section === 'rules' && (
					<RulesSection
						alertRules={alertRules}
						hiveMap={hiveMap}
						apiaries={apiaries}
						confirm={confirm}
						deleteAlertRule={deleteAlertRule}
						reexecuteQuery={reexecuteQuery}
						inText={inText}
						forText={forText}
						minText={minText}
						hiveIdText={hiveIdText}
						allHivesInText={allHivesInText}
						allHivesText={allHivesText}
						enabledText={enabledText}
						disabledText={disabledText}
						deleteRulePrompt={deleteRulePrompt}
						deleteText={deleteText}
						deleteRuleTitle={deleteRuleTitle}
					/>
				)}

				{section === 'history' && (
					<HistorySection
						alerts={alerts}
						alertsIllustrationAlt={alertsIllustrationAlt}
						hiveLabel={hiveLabel}
					/>
				)}
			</div>
			{ConfirmDialog}
		</div>
	)
}
