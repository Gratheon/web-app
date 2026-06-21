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

type BillingCycle = 'monthly' | 'yearly'
type PaidPlan = 'hobbyist' | 'starter' | 'professional'

export default function PricingPlans({ currentPlan = 'free', onPlanChange }: PricingPlansProps) {
	const [sessionError, setSessionError] = useState<Error | null>(null)
	const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

	const [createCheckoutSession, { error }] = useMutation(gql`
		mutation createCheckoutSession($plan: String, $cycle: String) {
			createCheckoutSession(plan: $plan, cycle: $cycle)
		}
	`)

	const handlePlanSelect = async (plan: string, cycle?: BillingCycle) => {
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

	const getPlanPricing = (plan: PaidPlan) => {
		const tier = BILLING_TIERS[plan]

		if (billingCycle === 'yearly' && 'yearly' in tier) {
			return {
				cycle: 'yearly' as const,
				amount: tier.yearly.pricePerYear,
				period: 'year' as const
			}
		}

		return {
			cycle: 'monthly' as const,
			amount: tier.monthly.price,
			period: 'month' as const
		}
	}

	const renderPrice = (plan: PaidPlan) => {
		const pricing = getPlanPricing(plan)

		return (
			<>
				<div className="price-line">
					<span className="price-amount">€{pricing.amount}</span>
					<span className="price-period">
						{' / '}{pricing.period === 'year' ? <T>year</T> : <T>month</T>}
					</span>
				</div>
				<Button className="plan-buy-button" onClick={() => handlePlanSelect(plan, pricing.cycle)}>
					<T>Buy</T>
				</Button>
			</>
		)
	}

	return (
		<div className="pricing-plans">
			{error && <MessageError error={error} />}
			{sessionError && <MessageError error={sessionError} />}

			<div className="billing-cycle-toggle" aria-label="Billing cycle">
				<div className="billing-cycle-toggle-group" data-cycle={billingCycle}>
					<button
						type="button"
						className={billingCycle === 'monthly' ? 'active' : ''}
						onClick={() => setBillingCycle('monthly')}
						aria-pressed={billingCycle === 'monthly'}
					>
						<span className="billing-cycle-label"><T>month</T></span>
					</button>
					<button
						type="button"
						className={billingCycle === 'yearly' ? 'active' : ''}
						onClick={() => setBillingCycle('yearly')}
						aria-pressed={billingCycle === 'yearly'}
					>
						<span className="billing-cycle-label"><T>year</T></span>
					</button>
				</div>
			</div>

			<div className="plans-grid">
				<div className="plan-card-wrapper">
					<div className="plan-indicator-slot">
						{currentPlan === 'free' && (
							<div className="current-plan-arrow">
								<T>Current plan</T> ↓
							</div>
						)}
					</div>
					<div className={`plan-card ${currentPlan === 'free' ? 'current' : ''}`}>
						<div className="plan-header plan-header-free">
							<h3 className="plan-name"><T>Free</T></h3>
							<div className="plan-description">
								<T>Perfect for beginners</T>
							</div>
						</div>

						<div className="plan-body">
							<div className="plan-pricing-simple">
								<div className="price-large">€0</div>
							</div>
							<div className="plan-details">
								<div className="plan-details-section">
									<h4><T>Features</T></h4>
									<ul className="plan-details-list">
										<li><T>Apiary & hive management</T></li>
										<li><T>Frame photo upload</T></li>
										<li><T>Keyboard support</T></li>
										<li><T>Public hive sharing</T></li>
										<li><T>QR code generation</T></li>
										<li><T>Treatment diary</T></li>
										<li><T>Feeding history</T></li>
										<li><T>Hive ownership transfer (in development)</T></li>
									</ul>
								</div>
								<div className="plan-details-section">
									<h4><T>Limits</T></h4>
									<ul className="plan-details-list">
										<li><T>Up to 3 hives</T></li>
										<li><T>10 frames per hive max</T></li>
										<li><T>No AI image processing</T></li>
										<li><T>6 months image retention</T></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="plan-card-wrapper">
					<div className="plan-indicator-slot">
						{currentPlan === 'hobbyist' && (
							<div className="current-plan-arrow">
								<T>Current plan</T> ↓
							</div>
						)}
					</div>
					<div className={`plan-card ${currentPlan === 'hobbyist' ? 'current' : ''}`}>
						<div className="plan-header plan-header-hobbyist">
							<h3 className="plan-name">{BILLING_TIERS.hobbyist.name}</h3>
							<div className="plan-description">
								<T>For taking the notes</T>
							</div>
						</div>

						<div className="plan-body">
							{renderPrice('hobbyist')}
							<div className="plan-details">
								<div className="plan-details-section">
									<h4><T>Features</T></h4>
									<ul className="plan-details-list">
										<li><T>Basic data management in database</T></li>
										<li><T>Frame photo upload and storage</T></li>
										<li><T>Hive placement planner</T></li>
										<li><T>Inspection notes and treatment diary</T></li>
										<li><T>Colony split management</T></li>
										<li><T>Colony joining tool</T></li>
										<li><T>Warehouse inventory management</T></li>
									</ul>
								</div>
								<div className="plan-details-section">
									<h4><T>Limits</T></h4>
									<ul className="plan-details-list">
										<li><T>Up to 15 hives</T></li>
										<li><T>1 user account</T></li>
										<li><T>No AI image processing features</T></li>
										<li><T>1 year image retention</T></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="plan-card-wrapper">
					<div className="plan-indicator-slot">
						{currentPlan === 'starter' && (
							<div className="current-plan-arrow">
								<T>Current plan</T> ↓
							</div>
						)}
					</div>
					<div className={`plan-card ${currentPlan === 'starter' ? 'current' : ''}`}>
						<div className="plan-header plan-header-starter">
							<h3 className="plan-name">{BILLING_TIERS.starter.name}</h3>
							<div className="plan-description">
								<T>Small-scale beekeepers</T>
							</div>
						</div>

						<div className="plan-body">
							{renderPrice('starter')}
							<div className="plan-details">
								<div className="plan-details-section">
									<h4><T>Features</T></h4>
									<ul className="plan-details-list">
										<li><T>Cell analysis</T></li>
										<li><T>Hive bottom board varroa counting</T></li>
										<li><T>Inspection management</T></li>
										<li><T>Frame annotation tool</T></li>
										<li><T>AI beekeeping assistant</T></li>
										<li><T>AI image analysis credits included monthly</T></li>
									</ul>
								</div>
								<div className="plan-details-section">
									<h4><T>Limits</T></h4>
									<ul className="plan-details-list">
										<li><T>1 user account</T></li>
										<li><T>Up to 50 hives</T></li>
										<li><T>30 frames per hive</T></li>
										<li><T>2 year image retention</T></li>
										<li><T>AI analysis volume capped per month</T></li>
										<li><T>Mixed real usage: expect ~100-130 AI prompts/month (hive, API, frame views)</T></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="plan-card-wrapper">
					<div className="plan-indicator-slot">
						{currentPlan === 'professional' && (
							<div className="current-plan-arrow">
								<T>Current plan</T> ↓
							</div>
						)}
					</div>
					<div className={`plan-card ${currentPlan === 'professional' ? 'current' : ''}`}>
						<div className="plan-header plan-header-professional">
							<h3 className="plan-name">{BILLING_TIERS.professional.name}</h3>
							<div className="plan-description">
								<T>Commercial beekeepers</T>
							</div>
						</div>

						<div className="plan-body">
							{renderPrice('professional')}
							<div className="plan-details">
								<div className="plan-details-section">
									<h4><T>Features</T></h4>
									<ul className="plan-details-list">
										<li><T>Hive telemetry storage</T></li>
										<li><T>Timeseries data analytics</T></li>
										<li><T>Colony comparison analytics (in development)</T></li>
										<li><T>AI-driven anomaly detection (in development)</T></li>
										<li><T>Device management (in development)</T></li>
										<li><T>Unlimited inspections per hive</T></li>
									</ul>
								</div>
								<div className="plan-details-section">
									<h4><T>Limits</T></h4>
									<ul className="plan-details-list">
										<li><T>Min 10 min telemetry resolution</T></li>
										<li><T>Up to 5 user accounts</T></li>
										<li><T>Up to 200 hives</T></li>
										<li><T>5 year image retention</T></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
