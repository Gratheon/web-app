import { format, formatDistance } from 'date-fns'
import { useParams } from 'react-router-dom'
import { useState } from 'react'

import Button from '@/shared/button'
import { gql, useMutation } from '@/api'
import MessageSuccess from '@/shared/messageSuccess'
import MessageError from '@/shared/messageError'
import T from '@/shared/translate'
import metrics from '@/metrics'

import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
import DateTimeAgo from '@/shared/dateTimeAgo'
import DateTimeFormat from '@/shared/dateTimeFormat'
import CreditCard from '@/icons/creditCard'
import Card from '@/shared/pagePaddedCentered/card'
const loadedDateLocales = { de, et, fr, pl, ru, tr }

export default function Billing({ user }) {
	let { stripeStatus } = useParams()
	const [sessionError, setSessionError] = useState(null)

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
		setSessionError(null)
		const result = await createCheckoutSession()
		metrics.trackBillingClicked()
		const sessionUrl = result?.data?.createCheckoutSession
		if (sessionUrl) {
			// Only redirect if a valid url was received
			window.location = sessionUrl
		} else if (!error) {
			// GraphQL/network error already handled via existing error variable;
			// this branch is for the case when mutation succeeded but returned null / empty
			setSessionError(new Error('Checkout session could not be created. Please try again later.'))
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
		<Card>
			{stripeStatus === 'success' && (
				<MessageSuccess title={<T>Payment completed</T>} />
			)}
			{stripeStatus === 'cancel' && <MessageError error={<T>Payment was cancelled</T>} />}

			{expirationError}

				<h3><T ctx="this is a headline for billing form">Billing</T></h3>
				{error && <MessageError error={error} />}
				{errorCancel && <MessageError error={errorCancel} />}
				{sessionError && <MessageError error={sessionError} />}

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
								<T>Expires in</T>&nbsp;
								<DateTimeAgo dateString={user.date_expiration} lang={user.lang} /> ( <DateTimeFormat datetime={user.date_expiration} lang={user.lang} /> )
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
		</Card>
	)
}
