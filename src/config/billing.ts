export const BILLING_TIERS = {
	free: {
		name: 'Free',
		color: '#f0f0f0',
		textColor: '#666'
	},
	hobbyist: {
		name: 'Hobbyist',
		color: '#FFD900',
		textColor: '#000',
		monthly: {
			price: 7,
			currency: 'EUR',
			stripePrice: 'price_hobbyist_monthly'
		},
		yearly: {
			price: 3.5,
			pricePerYear: 42,
			currency: 'EUR',
			savings: '50%',
			stripePrice: 'price_hobbyist_yearly'
		}
	},
	starter: {
		name: 'Starter',
		color: '#2f8b0b',
		textColor: '#fff',
		monthly: {
			price: 22,
			currency: 'EUR',
			stripePrice: 'price_starter_monthly'
		},
		yearly: {
			price: 11,
			pricePerYear: 132,
			currency: 'EUR',
			savings: '50%',
			stripePrice: 'price_starter_yearly'
		}
	},
	professional: {
		name: 'Professional',
		color: '#0248ff',
		textColor: '#fff',
		monthly: {
			price: 55,
			currency: 'EUR',
			stripePrice: 'price_professional_monthly'
		},
		yearly: {
			price: 27.5,
			pricePerYear: 330,
			currency: 'EUR',
			savings: '50%',
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
