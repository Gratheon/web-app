import type { ChatMessage } from './types'
import beekeeperURL from '@/assets/beekeeper.webp'
import AIAdvisorBillingNotice from '@/shared/aiAdvisorBillingNotice'
import KeyboardHints from '@/shared/keyboardHints'
import T from '@/shared/translate'
import { formatShortcutHintKeys } from './utils'
import styles from './styles.module.less'

type AIAdvisorDrawerViewProps = {
	viewName: string
	billingLocked: boolean
	aiUsage: any | null
	aiUsageSubtitle: string
	aiUsageRemainingLabel: string
	aiUsageRemaining: number
	batteryColor: string
	aiAdvisorAvatarAlt: string
	closeAiAdvisorLabel: string
	keyboardShortcutsLabel: string
	messages: ChatMessage[]
	draftMessage: string
	adviceContext: any | null
	isSendingUserMessage: boolean
	askAdvisorPlaceholder: string
	sendButtonLabel: string
	onClose: () => void
	onDraftMessageChange: (value: string) => void
	onSendUserMessage: () => void
}

export default function AIAdvisorDrawerView({
	viewName,
	billingLocked,
	aiUsage,
	aiUsageSubtitle,
	aiUsageRemainingLabel,
	aiUsageRemaining,
	batteryColor,
	aiAdvisorAvatarAlt,
	closeAiAdvisorLabel,
	keyboardShortcutsLabel,
	messages,
	draftMessage,
	adviceContext,
	isSendingUserMessage,
	askAdvisorPlaceholder,
	sendButtonLabel,
	onClose,
	onDraftMessageChange,
	onSendUserMessage,
}: AIAdvisorDrawerViewProps) {
	return (
		<div className={styles.drawer}>
			<div className={styles.header}>
				<img
					className={styles.avatar}
					src={beekeeperURL}
					alt={aiAdvisorAvatarAlt}
				/>
				<div className={styles.headerText}>
					<h3 className={styles.title}>
						<T>AI Advisor</T>
					</h3>
					<p className={styles.subtitle}>{viewName}</p>
					{!billingLocked && (
						<div className={styles.usageRow}>
							<p className={styles.usage}>{aiUsageSubtitle}</p>
							{aiUsage && (
								<span
									className={styles.battery}
									aria-label={`${aiUsageRemainingLabel}: ${aiUsageRemaining}%`}
								>
									{Array.from({ length: 8 }).map((_, index) => {
										const threshold = ((index + 1) / 8) * 100
										const isOn = aiUsageRemaining >= threshold
										return (
											<span
												key={`battery-segment-${index}`}
												className={`${styles.batterySegment} ${
													isOn ? styles.on : ''
												}`}
												style={
													isOn ? { backgroundColor: batteryColor } : undefined
												}
											/>
										)
									})}
									<span className={styles.batteryCap} />
								</span>
							)}
						</div>
					)}
				</div>
				<button
					className={styles.closeBtn}
					type="button"
					onClick={onClose}
					aria-label={closeAiAdvisorLabel}
				>
					×
				</button>
			</div>
			<div className={styles.body}>
				{messages.map((message) => {
					const roleClass =
						message.role === 'assistant'
							? styles.assistant
							: message.role === 'user'
							? styles.user
							: message.role === 'error'
							? styles.error
							: styles.system
					return (
						<div key={message.id} className={`${styles.message} ${roleClass}`}>
							{message.shortcuts ? (
								<div>
									<strong>
										{message.shortcutsTitle || keyboardShortcutsLabel}:
									</strong>
									<ul className={styles.shortcutList}>
										{message.shortcuts.map((item, index) => (
											<li
												key={`${message.id}-${index}`}
												className={styles.shortcutItem}
											>
												<KeyboardHints
													keys={formatShortcutHintKeys(item.keys)}
													absolute={false}
													alwaysVisible
													className={styles.inlineHint}
												/>
												<span>{item.action}</span>
											</li>
										))}
									</ul>
								</div>
							) : message.payloadOverview ? (
								<details className={styles.payloadDetails}>
									<summary className={styles.payloadSummary}>
										AI payload overview
									</summary>
									<pre className={styles.payloadPre}>
										{JSON.stringify(message.payloadOverview, null, 2)}
									</pre>
								</details>
							) : message.html ? (
								<div dangerouslySetInnerHTML={{ __html: message.html }} />
							) : (
								<div>
									{message.text}
									{message.loading && (
										<span className={styles.typing}>
											<span className={styles.dot} />
											<span className={styles.dot} />
											<span className={styles.dot} />
										</span>
									)}
								</div>
							)}
						</div>
					)
				})}
				{billingLocked && <AIAdvisorBillingNotice compact />}
			</div>
			<div className={styles.composer}>
				<textarea
					className={styles.composerInput}
					value={draftMessage}
					onChange={(event) =>
						onDraftMessageChange((event.target as HTMLTextAreaElement).value)
					}
					placeholder={askAdvisorPlaceholder}
					rows={3}
					disabled={billingLocked || !adviceContext || isSendingUserMessage}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault()
							onSendUserMessage()
						}
					}}
				/>
				<button
					className={styles.sendBtn}
					type="button"
					onClick={onSendUserMessage}
					disabled={
						billingLocked ||
						!adviceContext ||
						isSendingUserMessage ||
						!draftMessage.trim()
					}
				>
					{sendButtonLabel}
				</button>
			</div>
		</div>
	)
}
