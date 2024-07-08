import React from 'react'
import { format, formatDistance } from 'date-fns'
import { useParams } from 'react-router-dom'

import Button from '@/components/shared/button'
import { gql, useMutation } from '@/components/api'
import MessageSuccess from '@/components/shared/messageSuccess'
import MessageError from '@/components/shared/messageError'
import T from '@/components/shared/translate'
import metrics from '@/components/metrics'

import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
import DateTimeAgo from '@/components/shared/dateTimeAgo'
import DateFormat from '@/components/shared/dateFormat'
import CreditCard from '@/components/icons/creditCard'
const loadedDateLocales = { de, et, fr, pl, ru, tr }

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

	let expirationError = user.isSubscriptionExpired ? (
		<MessageSuccess isWarning={true} title={<T>Subscription has expired, please extend</T>} />
	) : null

	if (!user.lang) {
		return
	}

	const dateLangOptions = { locale: loadedDateLocales[user.lang] }

	return (
		<div>
			{stripeStatus === 'success' && (
				<MessageSuccess title={<T>Payment completed</T>} />
			)}
			{stripeStatus === 'cancel' && <MessageError error={<T>Payment was cancelled</T>} />}

			{expirationError}

			<div style="margin-bottom:5px; border: 1px dotted gray; padding: 10px; border-radius: 5px;">
				<h3><T ctx="this is a headline for billing form">Billing</T></h3>
				{error && <MessageError error={error} />}
				{errorCancel && <MessageError error={errorCancel} />}

				<div style=" display: flex">
					<div style={{ flexGrow: 1, marginTop: 5 }}>
						<div>
							<T>Billing plan</T>: {user.billingPlan}
						</div>

						<div>
							<T>Account created</T>: {format(new Date(user.date_added), 'dd MMMM yyyy, hh:mm', dateLangOptions)}
						</div>

						{user.isSubscriptionExpired &&
							<div>
								<T>Expired</T> {formatDistance(new Date(user.date_expiration), new Date(), dateLangOptions)} &mdash; {format(new Date(user.date_expiration), 'dd MMMM yyyy, hh:mm', dateLangOptions)}
							</div>
						}

						{!user.isSubscriptionExpired &&
							<div>
								<T>Expires in</T>
								<DateTimeAgo dateString={user.date_expiration} lang={user.lang} /> &mdash;
								<DateFormat datetime={user.date_expiration} lang={user.lang} />
							</div>
						}
					</div>

					<div>
						{(!user.hasSubscription || user.isSubscriptionExpired) && (
							<Button onClick={onSubscribeClick}>
								<CreditCard />
								<T ctx="this is a button that redirects to billing page to pay">Subscribe</T>
							</Button>
						)}
						{user.hasSubscription && !user.isSubscriptionExpired && (
							<Button onClick={onCancelSubscription}>
								<CreditCard />
								<T ctx="this is a button that cancels billing subscription">Cancel subscription</T>
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
