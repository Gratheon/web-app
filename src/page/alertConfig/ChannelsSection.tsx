import Button from '@/shared/button'
import T from '@/shared/translate'
import { Tab, TabBar } from '@/shared/tab'
import styles from './styles.module.less'
import type { AlertChannelConfig, AlertChannelType } from './types'

type Props = {
	selectedChannel: AlertChannelType
	setSelectedChannel: (channel: AlertChannelType) => void
	channelConfig: AlertChannelConfig
	onConfigChange: (e: any) => void
	onSave: (e: any) => void
	onDelete: () => void
	existingChannel: unknown
	saving: boolean
	enableChannelAlertsLabel: string
	smsLabel: string
	emailLabel: string
	telegramLabel: string
}

export function ChannelsSection({
	selectedChannel,
	setSelectedChannel,
	channelConfig,
	onConfigChange,
	onSave,
	onDelete,
	existingChannel,
	saving,
	enableChannelAlertsLabel,
	smsLabel,
	emailLabel,
	telegramLabel,
}: Props) {
	return (
		<div className={styles.panelSection}>
			<h2 className={styles.sectionTitle}>
				<T>Configure Alert Channels</T>
			</h2>
			<p style={{ color: '#666', margin: '16px 0' }}>
				<T>
					Configure how you want to receive alerts. You can enable multiple
					channels.
				</T>
			</p>

			<TabBar>
				<Tab
					isSelected={selectedChannel === 'SMS'}
					onClick={() => setSelectedChannel('SMS')}
				>
					{smsLabel}
				</Tab>
				<Tab
					isSelected={selectedChannel === 'EMAIL'}
					onClick={() => setSelectedChannel('EMAIL')}
				>
					{emailLabel}
				</Tab>
				<Tab
					isSelected={selectedChannel === 'TELEGRAM'}
					onClick={() => setSelectedChannel('TELEGRAM')}
				>
					{telegramLabel}
				</Tab>
			</TabBar>

			<form
				onSubmit={onSave}
				className={styles.configForm}
				style={{ marginTop: '16px' }}
			>
				{selectedChannel === 'SMS' && (
					<div className={styles.formRow}>
						<label htmlFor="phoneNumber" className={styles.configLabel}>
							<T>Phone Number</T>:
						</label>
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
						<label htmlFor="email" className={styles.configLabel}>
							<T>Email Address</T>:
						</label>
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
						<label htmlFor="telegramUsername" className={styles.configLabel}>
							<T>Telegram Username</T>:
						</label>
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
					<label htmlFor="timeStart" className={styles.configLabel}>
						<T>Time Window</T>:
					</label>
					<input
						className={`${styles.configInput} ${styles.timeInput}`}
						id="timeStart"
						type="time"
						name="timeStart"
						value={channelConfig.timeStart}
						onChange={onConfigChange}
					/>
					<span className={styles.toText}>
						<T>to</T>
					</span>
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
					<label
						htmlFor="enabled"
						className={styles.configLabel}
						style={{ fontWeight: 500 }}
					>
						{enableChannelAlertsLabel}
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
		</div>
	)
}
