import isDev from './isDev';

type PostHogClient = typeof import('posthog-js').default

const posthogKey = 'phc_cYQZSQ8ZJ8PjGGiT67gLusRp55EjZT41z2pHX6xtPZv'
let posthogClientPromise: Promise<PostHogClient | null> | null = null

function canUseMetrics() {
	return typeof window !== 'undefined' && !isDev()
}

function scheduleMetricsWork(callback: () => void) {
	if (typeof window === 'undefined') {
		return
	}

	const runWhenIdle = () => {
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(callback, { timeout: 2_000 })
			return
		}

		globalThis.setTimeout(callback, 0)
	}

	const runAfterLoad = () => {
		globalThis.setTimeout(runWhenIdle, 3_000)
	}

	if (document.readyState === 'complete') {
		runAfterLoad()
		return
	}

	window.addEventListener('load', runAfterLoad, { once: true })
}

function initPostHog() {
	if (!canUseMetrics()) {
		return Promise.resolve(null)
	}

	if (!posthogClientPromise) {
		posthogClientPromise = import('posthog-js')
			.then(({ default: posthog }) => {
				posthog.init(posthogKey, {
					api_host: 'https://eu.i.posthog.com',
					person_profiles: 'identified_only',
					advanced_disable_decide: true,
					autocapture: false,
					capture_pageleave: false,
					capture_pageview: false,
					disable_session_recording: true,
					disable_surveys: true,
				})

				return posthog
			})
			.catch((error) => {
				console.warn('[PostHog] Failed to initialize', error)
				posthogClientPromise = null
				return null
			})
	}

	return posthogClientPromise
}

function withPostHog(callback: (posthog: PostHogClient) => void) {
	if (!canUseMetrics()) {
		return
	}

	scheduleMetricsWork(() => {
		void initPostHog().then((posthog) => {
			if (posthog) {
				callback(posthog)
			}
		})
	})
}

export default {
	init: initPostHog,
	setUser: (user) => {
		if (!user?.id) return

		withPostHog((posthog) => {
			posthog.identify(user.id, { email: user.email })
		})
	},

	trackLogin: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('user.logged_in', extraInfo)
		})
	},
	trackRegistration: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('user.registered', extraInfo)
		})
	},
	trackApiaryCreated: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('apiary.created', extraInfo)
		})
	},

	trackBoxCreated: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('box.created', extraInfo)
		})
	},
	trackBoxRemoved: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('box.removed', extraInfo)
		})
	},

	trackFrameAdded: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('frame.created', extraInfo)
		})
	},
	trackFramePhotoUploaded: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('frame.photoUploaded', extraInfo)
		})
	},
	trackBillingClicked: (extraInfo = {}) => {
		withPostHog((posthog) => {
			posthog.capture('billing.clicked', extraInfo)
		})
	}
}
