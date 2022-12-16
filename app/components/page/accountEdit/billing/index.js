import React from 'react'
import { format } from 'date-fns'
import { useParams } from 'react-router-dom'

import Loading from '../../../shared/loader'
import Button from '../../../shared/button'
import { gql, useMutation } from '../../../api'
import MessageSuccess from '../../../shared/messageSuccess'
import MessageError from '../../../shared/messageError'

export default function Billing({ user }) {
	let { stripeStatus } = useParams()

	let [createCheckoutSession, { loading, error }] = useMutation(gql`
		mutation createCheckoutSession {
			createCheckoutSession
		}
	`)
	let [cancelSubscription, { loading: loadingCancel, error: errorCancel }] =
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

		if (result?.data) {
			window.location = result.data.createCheckoutSession
		}
	}

	async function onCancelSubscription() {
		const cancelResult = await cancelSubscription()
		console.log('cancelResult', cancelResult)

		if (!cancelResult.hasSubscription) {
			user.hasSubscription = cancelResult.hasSubscription
		}
	}
	// createCheckoutSession

	if (loading) {
		return <Loading />
	}

	let expirationError = user.isSubscriptionExpired ? (
		<MessageError error="Subscription expired, please extend" />
	) : null

	return (
		<div>
			<h2>Billing</h2>

			{expirationError}
			{error && <MessageError error={error} />}
			{errorCancel && <MessageError error={errorCancel} />}

			{stripeStatus === 'success' && (
				<MessageSuccess title="Payment completed" />
			)}
			{stripeStatus === 'cancel' && <MessageError error="Payment cancelled" />}
			<div style="font-size:12px;border-radius:5px; border:1px dotted gray; padding:20px;display:flex">
				<div style="flex-grow:1;">
					<div>
						Created: {format(new Date(user.date_added), 'dd MMMM yyyy, hh:mm')}
					</div>
					<div>
						Expires at:{' '}
						{format(new Date(user.date_expiration), 'dd MMMM yyyy, hh:mm')}
					</div>
				</div>

				<div>
					{!user.hasSubscription && (
						<Button onClick={onSubscribeClick}>Subscribe</Button>
					)}
					{user.hasSubscription && !loadingCancel && (
						<Button onClick={onCancelSubscription}>Cancel subscription</Button>
					)}
					{loadingCancel && <Loading />}
				</div>
			</div>
		</div>
	)
}
