import { render } from 'preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BillingEventIcon } from './eventIcons'

const EVENT_TYPES = [
	'registration',
	'subscription_created',
	'subscription_cancelled',
	'subscription_expired',
	'tier_changed',
	'payment_succeeded',
	'payment_failed',
	'unknown_event',
]

describe('BillingEventIcon', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		container.remove()
	})

	it.each(EVENT_TYPES)('renders a monochrome SVG for %s', (eventType) => {
		render(<BillingEventIcon eventType={eventType} />, container)

		const svg = container.querySelector('svg')
		expect(svg).not.toBeNull()
		expect(container.textContent).toBe('')
	})
})
