export const BILLING_TIERS = {
	free: {
		name: 'Free',
		color: '#f0f0f0',
		textColor: '#666'
	},
	starter: {
		name: 'Starter',
		color: '#FFD900',
		textColor: '#000',
		monthly: {
			price: 22,
			currency: 'EUR',
			stripePrice: 'price_starter_monthly'
		},
		yearly: {
			price: 12,
			pricePerYear: 144,
			currency: 'EUR',
			savings: '45%',
			stripePrice: 'price_starter_yearly'
		}
	},
	professional: {
		name: 'Professional',
		color: '#2f8b0b',
		textColor: '#fff',
		monthly: {
			price: 55,
			currency: 'EUR',
			stripePrice: 'price_professional_monthly'
		},
		yearly: {
			price: 33,
			pricePerYear: 396,
			currency: 'EUR',
			savings: '40%',
			stripePrice: 'price_professional_yearly'
		}
	},
	addon: {
		name: 'Addon',
		color: '#0248ff',
		textColor: '#fff',
		oneTime: {
			price: 100,
			currency: 'EUR',
			stripePrice: 'price_addon_onetime'
		}
	},
	enterprise: {
		name: 'Enterprise',
		color: '#000000',
		textColor: '#fff',
		custom: {
			price: 'Custom',
			currency: 'EUR'
		}
	}
}

