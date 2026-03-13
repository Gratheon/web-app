const BILLING_TIER_ORDER = ['free', 'hobbyist', 'starter', 'professional', 'enterprise'] as const

export type BillingTier = (typeof BILLING_TIER_ORDER)[number]

const BILLING_TIER_RANK: Record<string, number> = BILLING_TIER_ORDER.reduce(
	(acc, tier, index) => {
		acc[tier] = index
		return acc
	},
	{} as Record<string, number>
)

export function normalizeBillingTier(plan?: string | null): string {
	return String(plan || '').trim().toLowerCase() || 'free'
}

function getBillingTierRank(plan?: string | null): number {
	return BILLING_TIER_RANK[normalizeBillingTier(plan)] ?? BILLING_TIER_RANK.free
}

export function compareBillingTier(planA?: string | null, planB?: string | null): number {
	return getBillingTierRank(planA) - getBillingTierRank(planB)
}

export function isBillingTierAtLeast(plan?: string | null, minTier: BillingTier = 'free'): boolean {
	return compareBillingTier(plan, minTier) >= 0
}

export function isBillingTierLessThan(plan: string | null | undefined, tier: BillingTier): boolean {
	return compareBillingTier(plan, tier) < 0
}
