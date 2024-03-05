import React from 'react'
import { format } from 'date-fns'
import { useParams } from 'react-router-dom'

import Loading from '@/components/shared/loader'
import Button from '@/components/shared/button'
import { gql, useMutation } from '@/components/api'
import MessageSuccess from '@/components/shared/messageSuccess'
import MessageError from '@/components/shared/messageError'
import T from '@/components/shared/translate'
import metrics from '@/components/metrics'

export default function Billing({ user }) {
	let { stripeStatus } = useParams()

	let [createCheckoutSession, { error }] = useMutation(gql`
		mutation createCheckoutSession {
			createCheckoutSession
		}
	`)
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

	async function onSubscribeClick() {
		const result = await createCheckoutSession()

		metrics.trackBillingClicked()
		if (result?.data) {
			window.location = result.data.createCheckoutSession
		}
	}

	async function onCancelSubscription() {
		const cancelResult = await cancelSubscription()

		if (!cancelResult.hasSubscription) {
			user.hasSubscription = cancelResult.hasSubscription
		}
	}
	// createCheckoutSession

	let expirationError = user.isSubscriptionExpired ? (
		<MessageError error="Subscription expired, please extend" />
	) : null

	return (
		<div style="margin-bottom:5px; border: 1px dotted gray; padding: 10px; border-radius: 5px;">
			<h3><T ctx="this is a headline for billing form">Billing</T></h3>

			{expirationError}
			{error && <MessageError error={error} />}
			{errorCancel && <MessageError error={errorCancel} />}

			{stripeStatus === 'success' && (
				<MessageSuccess title="Payment completed" />
			)}
			{stripeStatus === 'cancel' && <MessageError error="Payment cancelled" />}
			<div style=" display: flex">
				<div style={{ flexGrow: 1 }}>
					<div>
						<T>Created</T>: {format(new Date(user.date_added), 'dd MMMM yyyy, hh:mm')}
					</div>
					<div>
						<T>Expires at</T>: {format(new Date(user.date_expiration), 'dd MMMM yyyy, hh:mm')}
					</div>
				</div>

				<div>
					{!user.hasSubscription && (
						<Button onClick={onSubscribeClick}><T ctx="this is a button that redirects to billing page to pay">Subscribe</T></Button>
					)}
					{user.hasSubscription && (
						<Button onClick={onCancelSubscription}><T ctx="this is a button that cancels billing subscription">Cancel subscription</T></Button>
					)}
				</div>
			</div>
		</div>
	)
}
