import { useState } from 'react'
import { gql, useMutation } from '@/api'
import Button from '@/shared/button'
import T from '@/shared/translate'
import MessageError from '@/shared/messageError'
import metrics from '@/metrics'
import { BILLING_TIERS } from '@/config/billing'
import './pricingPlans.css'

interface PricingPlansProps {
	currentPlan?: string
	onPlanChange?: (plan: string, cycle: string) => void
}

export default function PricingPlans({ currentPlan = 'free', onPlanChange }: PricingPlansProps) {
	const [sessionError, setSessionError] = useState<Error | null>(null)

	const [createCheckoutSession, { error }] = useMutation(gql`
		mutation createCheckoutSession($plan: String, $cycle: String) {
			createCheckoutSession(plan: $plan, cycle: $cycle)
		}
	`)

	const handlePlanSelect = async (plan: string, cycle?: 'monthly' | 'yearly') => {
		if (onPlanChange) {
			onPlanChange(plan, cycle || 'one-time')
			return
		}

		setSessionError(null)

		const result = await createCheckoutSession({
			plan,
			cycle: cycle || 'one-time'
		})

		metrics.trackBillingClicked()

		const sessionUrl = result?.data?.createCheckoutSession
		if (sessionUrl) {
			window.location.href = sessionUrl
		} else if (!error) {
			setSessionError(new Error('Checkout session could not be created. Please try again later.'))
		}
	}

	const getPlanStatus = (planName: string) => {
		if (currentPlan === 'addon') return 'current'
		if (currentPlan === 'free' && planName === 'starter') return 'upgrade'
		if (currentPlan === 'starter' && planName === 'professional') return 'upgrade'
		return 'available'
	}

	return (
		<div className="pricing-plans">
			{error && <MessageError error={error} />}
			{sessionError && <MessageError error={sessionError} />}

			<div className="plans-grid">
				<div className="plan-card-wrapper">
					{currentPlan === 'free' ? (
						<div className="current-plan-arrow">
							<T>Current plan</T> ↓
						</div>
					) : (
						<div className="plan-spacer"></div>
					)}
					<div className={`plan-card ${currentPlan === 'free' ? 'current' : ''}`}>
						<div className="plan-header plan-header-free">
							<h3 className="plan-name"><T>Free</T></h3>
							<div className="plan-description">
								<T>Hobbyist tier</T>
							</div>
						</div>

						<div className="plan-body">
							<div className="plan-pricing-simple">
								<div className="price-large">€0</div>
							</div>
						</div>
					</div>
				</div>

				<div className="plan-card-wrapper">
					{currentPlan === 'starter' && (
						<div className="current-plan-arrow">
							<T>Current plan</T> ↓
						</div>
					)}
					<div className={`plan-card ${currentPlan === 'starter' ? 'current' : ''}`}>
						<div className="plan-header plan-header-starter">
							<h3 className="plan-name">{BILLING_TIERS.starter.name}</h3>
							<div className="plan-description">
								<T>Small-scale beekeepers</T>
							</div>
						</div>

						<div className="plan-body">
							<div className="plan-pricing-options">
								<div className="price-row">
									<div className="price-info">
										<span className="price-amount">€{BILLING_TIERS.starter.monthly.price}</span>
										<span className="price-period">/<T>month</T></span>
									</div>
									<Button
										onClick={() => handlePlanSelect('starter', 'monthly')}
									>
										<T>Buy</T>
									</Button>
								</div>

								<div className="price-row recommended">
									<div className="price-info">
										<span className="price-amount">€{BILLING_TIERS.starter.yearly.price}</span>
										<span className="price-period">/<T>month</T></span>
										<span className="price-note">(€{BILLING_TIERS.starter.yearly.pricePerYear}/<T>year</T>)</span>
										<span className="savings-badge"><T>Save</T> {BILLING_TIERS.starter.yearly.savings}</span>
									</div>
									<Button
										onClick={() => handlePlanSelect('starter', 'yearly')}
									>
										<T>Buy</T>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="plan-card-wrapper">
					{currentPlan === 'professional' ? (
						<div className="current-plan-arrow">
							<T>Current plan</T> ↓
						</div>
					) : (
						<div className="plan-spacer"></div>
					)}
					<div className={`plan-card ${currentPlan === 'professional' ? 'current' : ''}`}>
						<div className="plan-header plan-header-professional">
							<h3 className="plan-name">{BILLING_TIERS.professional.name}</h3>
							<div className="plan-description">
								<T>Commercial beekeepers</T>
							</div>
						</div>

						<div className="plan-body">
							<div className="plan-pricing-options">
								<div className="price-row">
									<div className="price-info">
										<span className="price-amount">€{BILLING_TIERS.professional.monthly.price}</span>
										<span className="price-period">/<T>month</T></span>
									</div>
									<Button
										onClick={() => handlePlanSelect('professional', 'monthly')}
									>
										<T>Buy</T>
									</Button>
								</div>

								<div className="price-row recommended">
									<div className="price-info">
										<span className="price-amount">€{BILLING_TIERS.professional.yearly.price}</span>
										<span className="price-period">/<T>month</T></span>
										<span className="price-note">(€{BILLING_TIERS.professional.yearly.pricePerYear}/<T>year</T>)</span>
										<span className="savings-badge"><T>Save</T> {BILLING_TIERS.professional.yearly.savings}</span>
									</div>
									<Button
										onClick={() => handlePlanSelect('professional', 'yearly')}
									>
										<T>Buy</T>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

