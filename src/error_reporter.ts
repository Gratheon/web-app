import * as Sentry from "@sentry/react";

import isDev from './isDev'

export default function initErrorReporting() {
	const devMode = isDev();
	const disableSentry = import.meta.env.VITE_DISABLE_SENTRY === 'true';

	if (devMode || disableSentry) {
		console.log('[Sentry] Disabled in dev mode or by env var', { devMode, disableSentry });
		return;
	}

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
}