import { format } from 'date-fns'
import { useParams } from 'react-router-dom'

import Button from '@/shared/button'
import { gql, useMutation, useQuery } from '@/api'
import MessageSuccess from '@/shared/messageSuccess'
import MessageError from '@/shared/messageError'
import T from '@/shared/translate'
import PricingPlans from './pricingPlans'

import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
import CreditCard from '@/icons/creditCard'
import styles from './style.module.less'

const loadedDateLocales = { de, et, fr, pl, ru, tr }

const BILLING_HISTORY_QUERY = gql`
	query billingHistory {
		billingHistory {
			id
			eventType
			billingPlan
			details
			createdAt
		}
	}
`

export default function Billing({ user }) {
	let { stripeStatus } = useParams()

	const { data: historyData } = useQuery(BILLING_HISTORY_QUERY)

	let [cancelSubscription, { error: errorCancel }] =
		useMutation(gql`
			mutation cancelSubscription {
				cancelSubscription {
					... on User {
						hasSubscription
					}
					... on Error {
						code
					}
				}
			}
		`)

	async function onCancelSubscription() {
		const cancelResult = await cancelSubscription()

		if (!cancelResult.hasSubscription) {
			user.hasSubscription = cancelResult.hasSubscription
		}
	}

	if (!user.lang) {
		return
	}

	const dateLangOptions = { locale: loadedDateLocales[user.lang] }
	const billingHistory = historyData?.billingHistory || []
	const shouldShowTimelineConnector = billingHistory.length > 1

	const getEventIcon = (eventType: string) => {
		switch (eventType) {
			case 'registration': return '🧑‍🚀'
			case 'subscription_created': return '✅'
			case 'subscription_cancelled': return '❌'
			case 'subscription_expired': return '⏰'
			case 'tier_changed': return '🔄'
			case 'payment_succeeded': return '💳'
			case 'payment_failed': return '⚠️'
			default: return '•'
		}
	}

	const getEventColor = (eventType: string) => {
		switch (eventType) {
			case 'registration': return '#2196F3'
			case 'subscription_created': return '#4CAF50'
			case 'subscription_cancelled': return '#FF9800'
			case 'subscription_expired': return '#F44336'
			case 'tier_changed': return '#9C27B0'
			case 'payment_succeeded': return '#4CAF50'
			case 'payment_failed': return '#F44336'
			default: return '#999'
		}
	}

	return (
		<div>
			<section className={styles.section}>
				{stripeStatus === 'success' && (
					<MessageSuccess title={<T>Payment completed</T>} />
				)}
				{stripeStatus === 'cancel' && <MessageError error={<T>Payment was cancelled</T>} />}

				<h3><T ctx="this is a headline for billing form">Billing</T></h3>
				{errorCancel && <MessageError error={errorCancel} />}

				<div style={{ display: 'flex', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
					<div>
						<div style={{ color: '#666', fontSize: '0.9rem' }}>
							<T>Account created</T>: {format(new Date(user.date_added), 'dd MMMM yyyy', dateLangOptions)}
						</div>
					</div>

					<div>
						{user.hasSubscription && (
							<Button onClick={onCancelSubscription}>
								<CreditCard />
								<T ctx="this is a button that cancels billing subscription">Cancel subscription</T>
							</Button>
						)}
					</div>
				</div>

				<h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}><T>Billing History</T></h4>
				<div style={{ position: 'relative', paddingLeft: '2rem' }}>
					{shouldShowTimelineConnector && (
						<div style={{
							position: 'absolute',
							left: '1.4rem',
							top: 0,
							bottom: 0,
							width: '2px',
							background: 'linear-gradient(to bottom, #2196F3, #e0e0e0)'
						}} />
					)}

					{billingHistory.map((event) => (
						<div
							key={event.id}
							style={{
								position: 'relative',
								marginBottom: '1.5rem',
								paddingLeft: '1rem'
							}}
						>
							<div
								style={{
									position: 'absolute',
									left: '-1.6rem',
									top: '0.2rem',
									width: '2rem',
									height: '2rem',
									borderRadius: '50%',
									background: getEventColor(event.eventType),
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '1rem',
									boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
									zIndex: 1
								}}
							>
								{getEventIcon(event.eventType)}
							</div>

							<div style={{
								background: '#f9f9f9',
								padding: '0.75rem 1rem',
								borderRadius: '8px',
								border: '1px solid #e0e0e0'
							}}>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '0.25rem'
								}}>
									<div style={{ fontWeight: 600, color: '#333' }}>
										{event.details || event.eventType}
									</div>
									<div style={{ fontSize: '0.85rem', color: '#999' }}>
										{format(new Date(event.createdAt), 'dd MMM yyyy, HH:mm', dateLangOptions)}
									</div>
								</div>
								{event.billingPlan && (
									<div style={{ fontSize: '0.85rem', color: '#666' }}>
										<T>Plan</T>: <span style={{
											padding: '0.2rem 0.5rem',
											borderRadius: '4px',
											background: event.billingPlan === 'free' ? '#f0f0f0' :
												event.billingPlan === 'starter' ? '#FFD900' : '#2f8b0b',
											color: event.billingPlan === 'professional' ? '#fff' : '#000',
											fontWeight: 600
										}}>{event.billingPlan}</span>
									</div>
								)}
							</div>
						</div>
					))}

					{billingHistory.length === 0 && (
						<div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
							<T>No billing history yet</T>
						</div>
					)}
				</div>
			</section>

			<section className={styles.section}>
				<h3><T>Choose Your Plan</T></h3>
				<PricingPlans
					currentPlan={user.billingPlan || 'free'}
				/>
			</section>
		</div>
	)
}
