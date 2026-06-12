import isDev from './isDev'

function scheduleErrorReportingInit(callback: () => void) {
	if (typeof window === 'undefined') {
		return
	}

	const runWhenIdle = () => {
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(callback, { timeout: 3_000 })
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

export default function initErrorReporting() {
	const devMode = isDev();
	const disableSentry = import.meta.env.VITE_DISABLE_SENTRY === 'true';

	if (devMode || disableSentry) {
		console.log('[Sentry] Disabled in dev mode or by env var', { devMode, disableSentry });
		return;
	}

	scheduleErrorReportingInit(() => {
		void import('@sentry/react')
			.then((Sentry) => {
				console.log('[Sentry] Initializing in production mode');
				Sentry.init({
					environment: "production",
					dsn: "https://801a5f0788de882d5021e79cf557d719@o4504323550216192.ingest.sentry.io/4506093924122624",
					integrations: [
						Sentry.browserTracingIntegration(),
						Sentry.replayIntegration(),
					],
					// Performance Monitoring
					tracesSampleRate: 1.0, // Capture 100% of the transactions

					// Session Replay
					replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
					replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
				});
			})
			.catch((error) => {
				console.warn('[Sentry] Failed to initialize', error)
			})
	})
}
